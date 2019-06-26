import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Vector } from './components/vectors/Vector';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/internal/operators';
import axios from 'axios';
import { Promise } from 'q';

@Injectable({
  providedIn: 'root'
})

export class GeoserverService {

  private baseUrl = 'http://127.0.0.1:10010/v2/api/geoserver';  // URL to web api

  constructor(private http: HttpClient) {
  }

  getVectors(workspace?: string): Observable<any[]> {
    console.log('start getVectorList service...');
    const url = `${this.baseUrl}/layers?workspace=${workspace}&layerType=VECTOR`;
    return this.http.get<Vector[]>(url).pipe(
      tap(vectors => console.log(`${vectors.length} vectors`)),
      catchError(this.handleError('getVectors', []))
    );
  }

  // return the Vector's Features as Observables
  getFeatures(workspace: string, layer: string): Observable<any[]> {
    const url = `${this.baseUrl}/wfs/${workspace}/${layer}`;
    return this.http.get<any>(url).pipe(
      map(features => features.features),
      catchError(this.handleError('getFeatures', []))
    );
  }

  // return the Vector's Features as Promise
  getVectorFeatures(workspace: string, layer: string): Promise<any> | any {
    const url = `${this.baseUrl}/wfs/${workspace}/${layer}`;
    return axios.get(url)
      .then(results => results.data.features)
      .catch(error => this.handleError('getFeatures', []));
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
