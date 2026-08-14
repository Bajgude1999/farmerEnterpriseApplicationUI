import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment/environment';
import { Brand } from '../models/brand.model';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private http = inject(HttpClient);

  getAll(): Observable<Brand[]> {
    return this.http
      .get<{ data: Brand[] }>(`${environment.apiBaseUrl}/v1/brand/get-all`)
      .pipe(map((res) => res.data ?? []));
  }
}