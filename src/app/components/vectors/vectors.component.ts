import { Component, Input, OnInit } from '@angular/core';

import { Vector } from './Vector';
import { GeoserverService } from '../../geoserver.service';
import { AcEntity, AcNotification, ActionType } from 'angular-cesium';
import { Promise } from 'q';
import config from '../../config';

@Component({
  selector: 'vectors',
  templateUrl: './vectors.component.html',
  styleUrls: ['./vectors.component.less']
})

export class VectorsComponent implements OnInit {

  @Input()
  show: boolean;

  vectors: Vector[] = [];

  constructor(private geoserverService: GeoserverService) {
  }

  ngOnInit() {
    if (this.vectors.length === 0) {
      this.getVectors(config.WORKSPACE)
        .then(vectors => {
          if (vectors && vectors.length !== 0) {
            // console.log(`ngOnInit vectors: ${JSON.stringify(vectors, null, 3)}`);
            this.vectors = vectors.map(vector => {
              if (vector.features.length > 0) {
                vector = {
                  ...vector,
                  features: vector.features,
                  polygons: [],
                  lineStrings: [],
                  points: []
                };
                vector.features = vector.features.map((feature): AcNotification => this.featureToAcNotification(vector, feature));
                const parsedVector = this.parseVector(vector);
                return parsedVector;
              } else {
                console.log('this Vector has no features!');
              }
            });
          } else {
            console.log('No Vector was found!');
          }
        });
    }
  }

  getVectors(workspace: string): Promise<any> {
    return this.geoserverService.getVectors(workspace)
      .then(vectors => {
        vectors = vectors.filter(vector => (vector !== null) && (vector !== undefined));
        console.log(`workspace ${workspace} got ${vectors.length} vectors`);
        return vectors;
      });
  }

  getFeatures(workspace: string, layer: string): Promise<any> {
    return this.geoserverService.getWfsFeature(workspace, layer);
  }

  private parseVector(vector: any): Vector {
    return {
      id: vector.id,
      workspace: vector.workspace,
      name: vector.name,
      show: true,
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

    switch (geomType) {
      case 'Point':
      case 'MultiPoint':
        coords = (geomType === 'Point') ? coords : coords.flat(1);
        parsedFeature.entity = this.parsePoint(coords);
        vector.points.push(parsedFeature);
        return parsedFeature.entity;
      case 'LineString':
      case 'MultiLineString':
        coords = (geomType === 'LineString') ? coords.flat(1) : coords.flat(2);
        // correct the coordinates if they are composed of XYZ instead of XY point
        if ((coords.length % 2 !== 0) || (coords[1] === coords[2])) {
          coords = coords.filter((coord, index) => (index + 1) % 3 !== 0);
        }
        parsedFeature.entity = this.parseLineString(coords);
        vector.lineStrings.push(parsedFeature);
        return parsedFeature.entity;
      case 'Polygon':
      case 'MultiPolygon':
        coords = (geomType === 'Polygon') ? coords.flat(2) : coords.flat(3);
        parsedFeature.entity = this.parsePolygon(coords);
        vector.polygons.push(parsedFeature);
        return parsedFeature.entity;
    }
  }

  private parsePolygon(coords): AcEntity {
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

  showVector(vector: Vector) {
    vector.show = !vector.show;
  }
}


