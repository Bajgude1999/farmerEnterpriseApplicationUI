import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  State,
  District,
  Taluka
} from '../models/location.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private readonly apiUrl =
    `${environment.apiBaseUrl}/v1/location`;

  private http = inject(HttpClient);

  /**
   * Get all states
   */
  getStates(): Observable<State[]> {
    return this.http.get<any>(
      `${this.apiUrl}/states`
    ).pipe(
      map((res) => (Array.isArray(res) ? res : (res?.data ?? [])))
    );
  }

  /**
   * Get districts by state code
   */
  getDistricts(stateCd: number): Observable<District[]> {
    return this.http.get<any>(
      `${this.apiUrl}/districts/${stateCd}`
    ).pipe(
      map((res) => (Array.isArray(res) ? res : (res?.data ?? [])))
    );
  }

  /**
   * Get talukas by district code
   */
  getTalukas(districtCd: number): Observable<Taluka[]> {
    return this.http.get<any>(
      `${this.apiUrl}/talukas/${districtCd}`
    ).pipe(
      map((res) => (Array.isArray(res) ? res : (res?.data ?? [])))
    );
  }
}