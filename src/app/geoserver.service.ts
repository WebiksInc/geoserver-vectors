import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import axios, { AxiosResponse } from 'axios';
import { Promise } from 'q';
import config from './config';

@Injectable({
  providedIn: 'root'
})

export class GeoserverService {

  private restUrl = `${config.baseUrl}/rest`;

  private layersByType = [];

  private headers = {
    headers: {
      Authorization: config.auth
    }
  };

  constructor(private http: HttpClient) {
  }

  getVectors(workspace: string = 'all'): Promise<any[]> | any {
    console.log('start getVectorList service...', workspace);

    // 1. get all layers
    // 2. get vector's layers
    // 3. get layer's features

    const geoserverLayers = this.getLayers(workspace);
    return geoserverLayers.then(layers => {
      console.log(`workspace ${workspace} got ${layers.length} layers`);
      if (layers.length > 0) {
        const promise = layers.map(layer => {
          const vectorLayer = this.getVector(layer.href);
          return vectorLayer.then(vector => {
            if (vector) {
              const vectorFeatures = this.getWfsFeature(vector.workspace, vector.name);
              return vectorFeatures.then(features => {
                console.log(`vector ${vector.name} has ${features.length} features`);
                return {
                  ...vector,
                  features
                };
              });
            }
          });
        });

        return Promise.all(promise);

      } else {
        console.log(`there are no Layers!`);
        return of([]);
      }
    })
      .catch(error => this.handleError('getVectors', []));
  }

  getWfsFeature(workspace: string, layer: string): Promise<any> | any {
    const layerDetails = this.getLayerById(workspace, layer);
    return layerDetails.then(({featureType}) => {
      const url = `${config.baseUrl}${config.wfs.start}${workspace}:${layer}${config.wfs.middle}${featureType.srs}${config.wfs.end}`;
      console.log(url);
      return axios.get(url, this.headers)
        .then((geojson: any): any => geojson.data.features)
        .catch(error => this.handleError('getWfsFeature', []));
    })
      .catch(error => this.handleError('getWfsFeature', []));
  }

  private getLayers(workspace: string): Promise<any> | any {
    let url: string;
    if (workspace.toLowerCase() === 'all') {
      url = `${this.restUrl}/layers.json`;
    } else {
      url = `${this.restUrl}/workspaces/${workspace}/layers.json`;
    }
    console.log(`request url: ${url}`);

    return axios.get(url, this.headers)
      .then((layers: AxiosResponse<any>): Promise<any[]> | any => layers.data.layers.layer)
      .catch(error => this.handleError('getLayers', []));
  }

  private getVector(url: string): Promise<any> | any {
    return axios.get(url, this.headers)
      .then((layer: any): any => {
        const vector = layer.data.layer;
        if (vector.type.toLowerCase() === 'vector') {
          const id = vector.resource.name;
          const resource = id.split(':');
          return {
            ...vector,
            id,
            name: resource[1],
            workspace: resource[0]
          };
        }
      })
      .catch(error => this.handleError('getLayersByType'));
  }

  private getLayerById(workspace: string, layer: string): Promise<any> | any {
    const url = `${this.restUrl}/workspaces/${workspace}/layers/${layer}.json`;
    return axios.get(url, this.headers)
      .then((layer: any): any => {
        const detailUrl = layer.data.layer.resource.href;
        return axios.get(detailUrl, this.headers)
          .then((layerDetails: any): any => layerDetails.data)
          .catch(error => this.handleError('getLayerById'));
      })
      .catch(error => this.handleError('getLayerById'));
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.warn(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
