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

  // private baseUrl = 'http://127.0.0.1:10010/v2/api/geoserver';  // URL to web api
  private restUrl = `${config.baseUrl}/rest`;

  private headers = {
    headers: {
      Authorization: config.auth
    }
  };

  constructor(private http: HttpClient) {
  }

  getVectors(workspace?: string): Promise<any[]> | any {
    console.log('start getVectorList service...', workspace);
    let url: string;
    if (!workspace) {
      url = `${this.restUrl}/layers.json`;
    } else {
      url = `${this.restUrl}/workspaces/${workspace}/layers.json`;
    }
    console.log(`request url: ${url}`);

    return axios.get(url, this.headers)
      .then((layers: AxiosResponse<any>): any[] | PromiseLike<any[]> =>
        this.getLayersByType('vector', layers.data.layers.layer))
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

  private getLayersByType(layerType: string, layers: any[]): Promise<any[]> | any {
    const layersArray = layers.map(layerItem => {
      return axios.get(layerItem.href, this.headers)
        .then((layer: any): any => layer.data.layer)
        .catch(error => this.handleError('getLayersByType'));
    });
    return Promise.all<any[]>(layersArray)
      .then((layers: any[]): any[] => {
        const filteredLayers = layers.filter(({type}) => type.toLowerCase() === layerType.toLowerCase());
        console.log(`${filteredLayers.length} ${layerType} layers was found!`);
        return filteredLayers;
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
