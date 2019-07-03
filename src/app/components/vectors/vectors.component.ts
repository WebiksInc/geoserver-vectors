import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, Validators } from "@angular/forms";
import { AcEntity, AcNotification, ActionType } from 'angular-cesium';
import { Promise } from 'q';
import proj4 from 'proj4';

import { IVector } from './IVector';
import { GeoserverService } from '../../geoserver.service';

export type IPoint = [number, number];

@Component({
  selector: 'vectors',
  templateUrl: './vectors.component.html',
  styleUrls: ['./vectors.component.less']
})

export class VectorsComponent implements OnInit {
  isSubmitted = false;

  @Input()
  show: boolean;

  workspaces: string[];

  workspace: string;

  vectors: IVector[] = [];

  lonLatProj = 'EPSG:4326';

  constructor(private geoserverService: GeoserverService,
              public fb: FormBuilder) {
  }

  // Form
  registrationForm = this.fb.group({
    workspaceName: ['', [Validators.required]]
  });

  // Choose city using select dropdown
  changeWorkspace(e) {
    console.log(e.target.value);
    this.workspaceName.setValue(e.target.value, {
      onlySelf: true
    });
    this.onSubmit();
  }

  // Getter method to access formcontrols
  get workspaceName() {
    return this.registrationForm.get('workspaceName');
  }

  onSubmit() {
    this.isSubmitted = true;
    if (!this.registrationForm.valid) {
      return false;
    } else {
      console.log(`registrationForm.value: ${JSON.stringify(this.registrationForm.value)}`);
      this.workspace = this.registrationForm.value.workspaceName;
      console.log(`this.workspace: ${this.workspace}`);
      this.start(this.workspace);
    }
  }

  ngOnInit() {
    this.getWorkspaces();
  }

  start(workspace) {
    this.getVectors(workspace)
      .then(vectors => {
        if (vectors && vectors.length !== 0) {
          // console.log(`ngOnInit vectors: ${JSON.stringify(vectors, null, 3)}`);
          this.vectors = vectors.map(vector => {
            if (vector.features.length > 0) {
              vector = {
                ...vector,
                show: true,
                features: vector.features,
                polygons: [],
                lineStrings: [],
                points: []
              };
              vector.features = vector.features.map((feature): AcNotification => this.featureToAcNotification(vector, feature));
              return this.parseVector(vector);
            } else {
              console.log(`vector ${vector.name} has no features!`);
              return {
                ...vector,
                show: false,
                features: [],
                polygons: [],
                lineStrings: [],
                points: []
              };
            }
          });
        } else {
          console.log('No Vector was found!');
        }
      });
  }

  getWorkspaces(): Promise<string[]> {
    return this.geoserverService.getWorkspaces().then(workspaces => {
      this.workspaces = workspaces.filter(workspace => workspace);
    });
  }

  getVectors(workspace: string): Promise<any> {
    return this.geoserverService.getVectors(workspace)
      .then(vectors => {
        if (vectors.length > 0) {
          vectors = vectors.filter(vector => (vector !== null) && (vector !== undefined));
          console.log(`workspace ${workspace} got ${vectors.length} vectors`);
          return vectors;
        } else {
          console.log(`workspace ${workspace} has no Layers!`);
          return [];
        }
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
    const trans = vector.srs !== this.lonLatProj;

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
          coords = (geomType === 'LineString') ? coords.flat(2) : coords.flat(3);
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

  getFeatureSrs(crs: string) {
    return crs.substring(crs.lastIndexOf(':'));
  }

  getLonLatCoords(coords: IPoint[], proj: string): IPoint[] {
    return coords.map(point => this.getLonLatPoint(point, proj));
  }

  getLonLatPoint(point: IPoint, proj: string): IPoint {
    return proj4(proj, this.lonLatProj, point);
  }

  showVector(vector: IVector) {
    if (vector.features.length === 0) {
      vector.show = false;
      console.log(`vector ${vector.name} has no features!`);
    } else {
      vector.show = !vector.show;
    }
  }
}


