import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  /**
   * Get all states
   */
  getStates(): Observable<State[]> {
    return this.http.get<State[]>(
      `${this.apiUrl}/states`
    );
  }

  /**
   * Get districts by state code
   */
  getDistricts(stateCd: number): Observable<District[]> {
    return this.http.get<District[]>(
      `${this.apiUrl}/districts/${stateCd}`
    );
  }

  /**
   * Get talukas by district code
   */
  getTalukas(districtCd: number): Observable<Taluka[]> {
    return this.http.get<Taluka[]>(
      `${this.apiUrl}/talukas/${districtCd}`
    );
  }
}