import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { UnitOption } from '../../../models/unit.model';
import { Http } from '../../../common/http';
import { ApiResponse } from '../../../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UnitService {
  private http = inject(Http);

  getAll(): Observable<UnitOption[]> {
    return this.http
      .get<{ data: UnitOption[] }>(`${environment.apiBaseUrl}/v1/unit/get-all`)
      .pipe(map((res) => res.data ?? []));
  }

  getById(unitId: number): Observable<UnitOption> {
    return this.http
      .get<{ data: UnitOption[] }>(`${environment.apiBaseUrl}/v1/unit/get/${unitId}`)
      .pipe(map((res) => res.data?.[0]));
  }

  save(unit: Partial<UnitOption>): Observable<UnitOption> {
    return this.http
      .post<{ data: UnitOption[] }>(`${environment.apiBaseUrl}/v1/unit/save`, unit)
      .pipe(map((res) => res.data?.[0]));
  }

  update(unit: Partial<UnitOption>): Observable<UnitOption> {
    return this.http
      .put<{ data: UnitOption[] }>(`${environment.apiBaseUrl}/v1/unit/update`, unit)
      .pipe(map((res) => res.data?.[0]));
  }

  delete(unitId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${environment.apiBaseUrl}/v1/unit/delete/${unitId}`)
      .pipe(map(() => void 0));
  }
}