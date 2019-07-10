import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import axios, { AxiosResponse } from 'axios';
import { all, Promise, resolve } from 'q';
import { IHref, IWorkspace } from './types';
import config from './config';


@Injectable({
  providedIn: 'root'
})

export class GeoserverService {

  private restUrl = `${config.baseUrl}/rest`;

  private headers = {
    headers: {
      Authorization: config.auth
    }
  };

  constructor(private http: HttpClient) {
  }

  getWorkspaces(): any {

    // 1. get all workspaces
    // 2. check each workspaces has dataStores (vector layers)
    // 3. return a list of workspaces names which has vector layers

    const url = `${this.restUrl}/workspaces.json`;
    console.log(`start getWorkspaces...${url}`);
    return axios.get(url, this.headers)
      .then((results): any => {
        const workspaces: any = results.data.workspaces.workspace.map(({name}: Promise<IWorkspace> | any) => this.getWorkspacesWithVectors(name));
        return all(workspaces);
      })
      .catch(error => this.handleError('getWorkspaces', []));
  }

  // get vectors without the features
  getVectors(workspace: IWorkspace): any {
    console.log('start getVectors...', workspace.name);

    // 1. all the workspaces already has the dataStores
    // 2. get featureTypes for each dataStore (the vector's layers of the store)
    // 3. get each layer details (id, srs, nativeCRS)

    const datastores: IHref[] = workspace.datastores;
    const promise = datastores.map(({href}) => this.getFeatureTypes(workspace.name, href));
    return all(promise);
  }

  getWfsFeature(id: string, srs: string): any {
    const url = `${config.baseUrl}${config.wfs.start}${id}${config.wfs.middle}${srs}${config.wfs.end}`;
    return axios.get(url, this.headers)
      .then((geojson: AxiosResponse<any>): any => geojson.data.features)
      .catch(error => this.handleError('getWfsFeature', []));
  }

  private getWorkspacesWithVectors(workspace: string): any {
    const url = `${this.restUrl}/workspaces/${workspace}/datastores.json`;
    return axios.get(url, this.headers)
      .then((results: AxiosResponse<any>): any => {
        let datastores = results.data.dataStores;
        if (datastores) {
          datastores = datastores.dataStore;
          return {
            name: workspace,
            datastores,
            vectors: []
          };
        }
      })
      .catch(error => this.handleError('getWorkspacesWithVectors'));
  }

  private getFeatureTypes(workspace: string, url: string): any {
    return axios.get(url, this.headers)
      .then((results: AxiosResponse<any>): any[] => {
        const datastore = results.data.dataStore.featureTypes;
        const feautreTypes: any = this.getFeatureType(datastore);
        return feautreTypes.then(vectors => {
          const promise = vectors.map(vector => this.getVector(workspace, vector.href));
          return all(promise);
        });
      })
      .catch(error => this.handleError('getFeatureTypes', []));
  }

  private getFeatureType(url: string): any {
    return axios.get(url, this.headers)
      .then((results: AxiosResponse<any>): any[] => results.data.featureTypes.featureType)
      .catch(error => this.handleError('getLayersByType', []));
  }

  // get vector data without the features (WFS)
  private getVector(workspace: string, url: string): any {

    // get vector's details (id, srs, nativeCRS)

    return axios.get(url, this.headers)
      .then((results: AxiosResponse<any>): any => {
        const vector = results.data.featureType;
        const id = `${workspace}:${vector.name}`;
        const srs = vector.srs;
        const nativeCrs = vector.srs === config.lonLatProj ? vector.nativeCRS : vector.nativeCRS['$'];
        // console.log(`getVector nativeCrs: ${JSON.stringify(nativeCrs)}`);
        return {
          id,
          workspace,
          name: vector.name,
          srs,
          nativeCrs,
          show: false,
          features: [],
          polygons: [],
          lineStrings: [],
          points: []
        };
      })
      .catch(error => this.handleError('getLayersByType'));
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Promise<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.warn(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return resolve(result);
    };
  }
}
