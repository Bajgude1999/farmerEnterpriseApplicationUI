import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UnitOption } from '../models/unit.model';
import { Http } from '../common/http';

@Injectable({ providedIn: 'root' })
export class UnitService {
  private http = inject(Http);

  getAll(): Observable<UnitOption[]> {
    return this.http
      .get<{ data: UnitOption[] }>(`${environment.apiBaseUrl}/v1/unit/get-all`)
      .pipe(map((res) => res.data ?? []));
  }
}