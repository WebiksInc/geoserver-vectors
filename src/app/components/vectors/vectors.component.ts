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
  features: AcNotification[] = [];
  polygons: AcNotification[] = [];
  lineStrings: AcNotification[] = [];
  points: AcNotification[] = [];

  constructor(private geoserverService: GeoserverService) {
  }

  ngOnInit() {
    this.getVectors(config.WORKSPACE)
      .then(vectors => {
        if (vectors && vectors.length !== 0) {
          vectors.map(vector => {
            const id = vector.resource.name;
            console.log(`vector id: ${id}`);
            const resource = id.split(':');
            const promise = this.getFeatures(resource[0], resource[1]);

            Promise.all<any>(promise.then(features => {
              this.features = features.map((feature): AcNotification => this.featureToAcNotification(feature));
              const vectorLayer: Vector = {
                id,
                workspace: resource[0],
                name: resource[1],
                show: true,
                features: this.features,
                polygons: this.polygons,
                lineStrings: this.lineStrings,
                points: this.points
              };
              this.vectors.push(vectorLayer);
            }));
          });
        } else {
          console.log('No Vector was found!');
        }
      });
  }

  getVectors(workspace: string): Promise<any> {
    return this.geoserverService.getVectors(workspace);
  }

  getFeatures(workspace: string, layer: string): Promise<any> {
    return this.geoserverService.getWfsFeature(workspace, layer);
  }

  private featureToAcNotification(feature: any): AcNotification {
    const parseFeature = {
      id: feature.id,
      actionType: ActionType.ADD_UPDATE,
      entity: {}
    };
    parseFeature.entity = this.parseFeature(feature, parseFeature);
    return parseFeature;
  }

  private parseFeature(feature: any, parseFeature: AcNotification): AcEntity {
    const geomType = feature.geometry.type;
    let coords = feature.geometry.coordinates;

    switch (geomType) {
      case 'Point':
      case 'MultiPoint':
        coords = (geomType === 'Point') ? coords : coords.flat(1);
        parseFeature.entity = this.parsePoint(coords);
        this.points.push(parseFeature);
        return parseFeature.entity;
      case 'LineString':
      case 'MultiLineString':
        coords = (geomType === 'LineString') ? coords.flat(1) : coords.flat(2);
        parseFeature.entity = this.parseLineString(coords);
        this.lineStrings.push(parseFeature);
        return parseFeature.entity;
      case 'Polygon':
      case 'MultiPolygon':
        coords = (geomType === 'Polygon') ? coords.flat(2) : coords.flat(3);
        parseFeature.entity = this.parsePolygon(coords);
        this.polygons.push(parseFeature);
        return parseFeature.entity;
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
        width: 10,
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


