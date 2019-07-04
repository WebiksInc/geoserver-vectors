import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import axios, { AxiosResponse } from 'axios';
import { all, Promise, resolve } from 'q';
import { IVector, IWorkspace } from './types';
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
        const workspaces: any = results.data.workspaces.workspace.map(({ name }: Promise<IWorkspace> | any) => this.getWorkspacesWithVectors(name));
        return all(workspaces);
      })
      .catch(error => this.handleError('getWorkspaces', []));
  }

  getVectors(workspace: IWorkspace): any {
    console.log('start getVectors...', workspace.name);

    // 1. all the workspaces already has the dataStores
    // 2. get featureTypes for each dataStore (the vector's layers of the store)
    // 3. get each layer details (id, srs, nativeCRS)
    // 4. get each layer features (WFS)

    const datastores = workspace.datastores;
    const promise = datastores.map(({ href }) => this.getFeatureTypes(workspace.name, href));
    return all(promise);
  }

  private getWorkspacesWithVectors(workspaceName: string): any {
    return this.getDatastores(workspaceName);
  }

  private getDatastores(workspace: string): any {
    const url = `${this.restUrl}/workspaces/${workspace}/datastores.json`;
    return axios.get(url, this.headers)
      .then((results: AxiosResponse<any>): any => {
        let datastores = results.data.dataStores;
        if (datastores) {
          datastores = datastores.dataStore;
          return {
            name: workspace,
            datastores
          };
        }
      })
      .catch(error => this.handleError('getDatastores'));
  }

  private getFeatureTypes(workspace: string, url: string): any {
    return axios.get(url, this.headers)
      .then((results: AxiosResponse<any>): any[] => {
        const datastore = results.data.dataStore.featureTypes;
        const feautreTypes: any = this.getFeatureType(datastore);
        return feautreTypes.then(vectors => {
          vectors = vectors.map(vector => this.getVector(workspace, vector.href));
          return all(vectors);
        });
      })
      .catch(error => this.handleError('getDatastores', []));
  }

  private getFeatureType(url: string): any {
    return axios.get(url, this.headers)
      .then((results: AxiosResponse<any>): any[] => results.data.featureTypes.featureType)
      .catch(error => this.handleError('getLayersByType', []));
  }

  private getVector(workspace: string, url: string): any {

    // 1. get vector's details (id, srs, nativeCRS)
    // 2. get vector's features (WFS)

    return axios.get(url, this.headers)
      .then((results: AxiosResponse<any>): any => {
        const vector = results.data.featureType;
        const id = `${workspace}:${vector.name}`;
        // get the vector's features by WFS requset
        const vectorFeatures: any = this.getWfsFeature(id, vector.srs);
        return vectorFeatures.then((features): IVector =>
          ({
            id,
            workspace,
            name: vector.name,
            srs: vector.srs,
            nativeCrs: vector.nativeCRS['$'],
            features
          })
        );
      })
      .catch(error => this.handleError('getLayersByType'));
  }

  private getWfsFeature(id: string, srs: string): any {
    const url = `${config.baseUrl}${config.wfs.start}${id}${config.wfs.middle}${srs}${config.wfs.end}`;
    return axios.get(url, this.headers)
      .then((geojson: AxiosResponse<any>): any => geojson.data.features)
      .catch(error => this.handleError('getWfsFeature', []));
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
