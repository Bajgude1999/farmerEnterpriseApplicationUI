import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Brand } from '../models/brand.model';
import { Http } from '../common/http';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private http = inject(Http);

  getAll(): Observable<Brand[]> {
    return this.http
      .get<{ data: Brand[] }>(`${environment.apiBaseUrl}/v1/brand/get-all`)
      .pipe(map((res) => res.data ?? []));
  }

  getById(brandId: number): Observable<Brand> {
    return this.http
      .get<{ data: Brand[] }>(`${environment.apiBaseUrl}/v1/brand/get/${brandId}`)
      .pipe(map((res) => res.data?.[0]));
  }

  save(brand: Partial<Brand>): Observable<Brand> {
    return this.http
      .post<{ data: Brand[] }>(`${environment.apiBaseUrl}/v1/brand/save`, brand)
      .pipe(map((res) => res.data?.[0]));
  }

  update(brand: Partial<Brand>): Observable<Brand> {
    return this.http
      .put<{ data: Brand[] }>(`${environment.apiBaseUrl}/v1/brand/update`, brand)
      .pipe(map((res) => res.data?.[0]));
  }

  delete(brandId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${environment.apiBaseUrl}/v1/brand/delete/${brandId}`)
      .pipe(map(() => void 0));
  }
}