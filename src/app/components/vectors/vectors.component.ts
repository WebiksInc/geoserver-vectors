import { Component, Input, OnInit } from '@angular/core';
import { AcEntity, AcNotification, ActionType } from 'angular-cesium';
import { Promise } from 'q';
import proj4 from 'proj4';

import { IPoint, IVector } from '../../types';
import { GeoserverService } from '../../geoserver.service';
import { isArray } from 'util';
import config from '../../config';

@Component({
  selector: 'vectors',
  templateUrl: './vectors.component.html',
  styleUrls: ['./vectors.component.less']
})

export class VectorsComponent implements OnInit {

  @Input()
  vectors: IVector[];

  title = 'show';
  showAllVectors = false;

  constructor(private geoserverService: GeoserverService) {
  }

  ngOnInit() {
  }

  showVector(vector: IVector, index: number) {
    console.log(`showVector vector show = ${vector.show}`);
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
          }
        });
      } else {
        console.log(`vector ${vector.name} has no features!`);
      }
    } else {
      console.log(`showVector change show: ${vector.show}`);
    }
  }

  displayLayers() {
    this.showAllVectors = !this.showAllVectors;
    console.log(`displayLayers showAllVectors: ${this.showAllVectors}`);
    if (this.showAllVectors) {
      this.title = 'hide';
      this.vectors.map((vector: IVector, index: number) => {
        vector.show = true;
        this.showVector(vector, index);
      });
    } else {
      this.title = 'show';
      this.vectors.map((vector: IVector) => {
        vector.show = false;
      });
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


