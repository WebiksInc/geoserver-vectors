import { Component, Input, OnInit } from '@angular/core';

import { Vector } from './Vector';
import { GeoserverService } from '../../geoserver.service';
import { Observable } from 'rxjs';
import { AcEntity, AcNotification, ActionType } from 'angular-cesium';
import { Promise } from 'q';

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


  constructor(private geoserverService: GeoserverService) {
  }

  ngOnInit() {
    const workspace = 'topp';
    this.getVectors(workspace)
      .subscribe(vectors => {
        vectors.map(vector => {
          const id = vector.resource.name;
          console.log(`vector id: ${id}`);
          const resource = id.split(':');
          const promise = this.getFeatures(resource[0], resource[1]);

          Promise.all(promise.then(features => {
            this.features = features.map((feature): AcNotification => this.featureToAcNotification(feature));
            const vectorLayer = {
              id,
              workspace: resource[0],
              name: resource[1],
              show: true,
              features: this.features
            };
            this.vectors.push(vectorLayer);
            this.vectors.map(vector => console.log(`this.vectors: ${vector.id}`));
          }));
        });
      });
  }

  getVectors(workspace: string): Observable<any[]> {
    return this.geoserverService.getVectors(workspace);
  }

  getFeatures(workspace: string, layer: string): Promise<any> {
    return this.geoserverService.getVectorFeatures(workspace, layer);
  }

  private featureToAcNotification(feature: any): AcNotification {
    return {
      id: feature.id,
      actionType: ActionType.ADD_UPDATE,
      entity: this.parseFeature(feature)
    };
  }

  private parseFeature(feature): AcEntity {
    const geomType = feature.geometry.type;
    const coords = feature.geometry.coordinates;

    console.log(`feature ${feature.id} geom: ${geomType}`);

    switch (geomType) {
      case 'MultiPoint':
        return this.parsePoint(coords.flat(1));
      case 'MultiLineString':
        return this.parseLineString(coords.flat(2));
      case 'MultiPolygon':
        return this.parsePolygon(coords.flat(3));
    }
  }

  private parsePolygon(coord): AcEntity {
    console.log('parsePolygon...');
    return new AcEntity(
      ({
        hierarchy: Cesium.Cartesian3.fromDegreesArray(coord),
        // height: 0,
        extrudedHeight: 0,
        perPositionHeight: true,
        material: Cesium.Color.ORANGE.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.BLACK,
        show: true
      })
    );
  }

  private parseLineString(coord): AcEntity {
    console.log('parseLineString...');
    return new AcEntity(
      ({
        positions: Cesium.Cartesian3.fromDegreesArray(coord),
        height: 0,
        material: Cesium.Color.GREEN,
        width: 20,
        zIndex: 10,
        show: true
      })
    );
  }

  private parsePoint(coord): AcEntity {
    console.log('parsePoint...');
    return new AcEntity(
      ({
        positions: Cesium.Cartesian3.fromDegreesArray(coord),
        height: 0,
        material: Cesium.Color.RED,
        pixelSize: 20,
        outline: true,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 5,
        zIndex: 15,
        scaleByDistance: new Cesium.NearFarScalar(),
        show: true
      })
    );
  }


  showVector(vector: Vector) {
    vector.show = !vector.show;
  }
}


