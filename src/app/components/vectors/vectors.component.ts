import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from "@angular/forms";
import { AcEntity, AcNotification, ActionType } from 'angular-cesium';
import { Promise } from 'q';
import proj4 from 'proj4';

import { IVector, IWorkspace, IPoint} from '../../types';
import { GeoserverService } from '../../geoserver.service';
import { isArray } from 'util';
import config from '../../config';

@Component({
  selector: 'vectors',
  templateUrl: './vectors.component.html',
  styleUrls: ['./vectors.component.less']
})

export class VectorsComponent implements OnInit {
  isSubmitted = false;

  workspaces: IWorkspace[];
  selecedWorkspace: string;
  workspace: IWorkspace;
  vectors: IVector[] = [];

  constructor(private geoserverService: GeoserverService,
              public fb: FormBuilder) {
  }

  // Form
  registrationForm = this.fb.group({
    workspaceName: ['', [Validators.required]]
  });

  // Choose city using select dropdown
  changeWorkspace(e) {
    this.workspaceName.setValue(e.target.value, {
      onlySelf: true
    });
    this.onSubmit();
  }

  // Getter method to access form controls
  get workspaceName() {
    return this.registrationForm.get('workspaceName');
  }

  onSubmit() {
    this.isSubmitted = true;
    if (!this.registrationForm.valid) {
      return false;
    } else {
      this.selecedWorkspace = this.registrationForm.value.workspaceName;
      this.workspace = this.workspaces.find(({ name }) => name === this.selecedWorkspace);
      if (this.workspace.vectors.length === 0) {
        this.start();
      }
    }
  }

  ngOnInit() {
    this.getWorkspaces();
  }

  start() {
    console.log(`start START...${this.workspace.name}`);
    if (this.workspace.vectors.length === 0) {
      this.getVectors()
        .then(vectors => {
          if (vectors && vectors.length !== 0) {
            this.vectors = vectors;
            this.workspace.vectors = this.vectors;
            console.log(`start vectors: ${JSON.stringify(this.workspace.vectors, null, 3)}`);
          } else {
            console.log('No Vector was found!');
          }
        });
    } else {
      this.vectors = this.workspace.vectors;
      console.log(`workspace ${this.workspace.name} already has been checked for vectors!`);
    }
  }

  getWorkspaces() {
    const getWorkspaces: any = this.geoserverService.getWorkspaces();
    getWorkspaces.then((workspaces: IWorkspace[]) => {
      this.workspaces = workspaces.filter(workspace => workspace);
    });
  }

  getVectors(): Promise<any> {
    return this.geoserverService.getVectors(this.workspace)
      .then(vectors => {
        if (vectors.length > 0) {
          if (isArray(vectors[0])) {
            vectors = vectors.flat(1);
          }
          vectors = vectors.filter(vector => (vector !== null) && (vector !== undefined));
          console.log(`workspace ${this.workspace.name} got ${vectors.length} vectors`);
        } else {
          console.log(`workspace ${this.workspace.name} has no Layers!`);
          vectors = [];
        }
        this.workspace.vectors = vectors;
        return vectors;
      });
  }

  showVector(vector: IVector, index: number) {
    if (vector.features.length === 0) {
      if (vector.show) {
        // get the vector's features and display it on the map
        const features = this.getFeatures(vector);
        features.then(results => {
          vector.features = results;
          if (vector.features.length === 0) {
            vector.show = false;
            console.log(`vector ${vector.name} has no features!`);
          } else {
            vector.features = vector.features.map((feature): AcNotification => this.featureToAcNotification(vector, feature));
            vector = this.parseVector(vector);
            this.vectors[index] = vector;
            this.workspace.vectors = this.vectors;
          }
        });
      } else {
        console.log(`vector ${vector.name} has no features!`);
      }
    } else {
      vector.show = !vector.show;
      console.log(`showVector change show: ${vector.show}`);
    }
  }

  private getFeatures(vector: IVector): Promise<any> {
    console.log(`start getFeature for vector ${vector.name}...`);
    return this.geoserverService.getWfsFeature(vector.id, vector.srs)
      .then(features => {
        if (features.length > 0) {
          if (isArray(features[0])) {
            features = features.flat(1);
          }
          features = features.filter(features => (features !== null) && (features !== undefined));
          console.log(`vector ${vector.name} got ${features.length} features`);
        } else {
          console.log(`vector ${vector.name} has no Layers!`);
          features = [];
        }
        return features;
      });
  }

  private parseVector(vector: any): IVector {
    return {
      id: vector.id,
      workspace: vector.workspace,
      name: vector.name,
      srs: vector.srs,
      nativeCrs: vector.nativeCrs,
      show: vector.show,
      features: vector.features,
      polygons: vector.polygons,
      lineStrings: vector.lineStrings,
      points: vector.points
    };
  }

  private featureToAcNotification(vector: any, feature: any): AcNotification {
    const parsedFeature = {
      id: feature.id,
      actionType: ActionType.ADD_UPDATE,
      entity: {}
    };
    parsedFeature.entity = this.parseFeature(vector, feature, parsedFeature);
    return parsedFeature;
  }

  private parseFeature(vector: any, feature: any, parsedFeature: AcNotification): AcEntity {
    const geomType = feature.geometry.type;
    let coords = feature.geometry.coordinates;
    const proj = vector.nativeCrs;
    const trans = vector.srs !== config.lonLatProj;

    switch (geomType) {
      case 'Point':
      case 'MultiPoint':
        coords = (geomType === 'Point') ? coords : coords.flat(1);
        if (trans) {
          coords = this.getLonLatPoint(coords, proj);
        }
        parsedFeature.entity = this.parsePoint(coords);
        vector.points.push(parsedFeature);
        return parsedFeature.entity;
      case 'LineString':
      case 'MultiLineString':
        coords = (geomType === 'LineString') ? coords : coords.flat(1);
        // correct the coordinates if they are composed of XYZ instead of XY point
        if (coords[0].length > 2) {
          coords = coords.map(point => point.slice(0, 2));
        }
        if (trans) {
          coords = this.getLonLatCoords(coords, proj);
        }
        coords = coords.flat(1);
        parsedFeature.entity = this.parseLineString(coords);
        vector.lineStrings.push(parsedFeature);
        return parsedFeature.entity;
      case 'Polygon':
      case 'MultiPolygon':
        if (trans) {
          coords = (geomType === 'Polygon') ? coords.flat(1) : coords.flat(2);
          coords = this.getLonLatCoords(coords, proj);
          coords = coords.flat(1);
        } else {
          coords = (geomType === 'Polygon') ? coords.flat(2) : coords.flat(3);
        }
        parsedFeature.entity = this.parsePolygon(coords);
        vector.polygons.push(parsedFeature);
        return parsedFeature.entity;
    }
  }

  private parsePolygon(coords): AcEntity {
    // console.log(`parsePolygon coords: ${JSON.stringify(coords)}`);
    return new AcEntity(
      ({
        hierarchy: Cesium.Cartesian3.fromDegreesArray(coords),
        material: Cesium.Color.ORANGE.withAlpha(0.8),
        height: 0,
        outline: true,
        outlineColor: Cesium.Color.BLACK,
        show: true
      })
    );
  }

  private parseLineString(coords): AcEntity {
    // console.log(`parseLineString coords(after): ${JSON.stringify(coords)}`);
    return new AcEntity(
      ({
        positions: Cesium.Cartesian3.fromDegreesArray(coords),
        material: Cesium.Color.GREEN,
        height: 0,
        width: 5,
        clampToGround: true,
        zIndex: 10,
        show: true
      })
    );
  }

  private parsePoint(coords): AcEntity {
    // console.log(`parsePoint coords: ${JSON.stringify(coords)}`);
    return new AcEntity(
      ({
        position: Cesium.Cartesian3.fromDegrees(coords[0], coords[1]),
        color: Cesium.Color.RED,
        pixelSize: 10,
        height: 0,
        outline: true,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        zIndex: 20,
        show: true
      })
    );
  }

  private getLonLatCoords(coords: IPoint[], proj: string): IPoint[] {
    return coords.map(point => this.getLonLatPoint(point, proj));
  }

  private getLonLatPoint(point: IPoint, proj: string): IPoint {
    return proj4(proj, config.lonLatProj, point);
  }
}


