import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';
import { Http } from '../common/http';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(Http);

  getAll(): Observable<Category[]> {
    return this.http
      .get<{ data: Category[] }>(`${environment.apiBaseUrl}/v1/category/get-all`)
      .pipe(map((res) => res.data ?? []));
  }

  getById(categoryId: number): Observable<Category> {
    return this.http
      .get<{ data: Category[] }>(`${environment.apiBaseUrl}/v1/category/get/${categoryId}`)
      .pipe(map((res) => res.data?.[0]));
  }

  save(category: Partial<Category>): Observable<Category> {
    return this.http
      .post<{ data: Category[] }>(`${environment.apiBaseUrl}/v1/category/save`, category)
      .pipe(map((res) => res.data?.[0]));
  }

  update(category: Partial<Category>): Observable<Category> {
    return this.http
      .put<{ data: Category[] }>(`${environment.apiBaseUrl}/v1/category/update`, category)
      .pipe(map((res) => res.data?.[0]));
  }

  delete(categoryId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${environment.apiBaseUrl}/v1/category/delete/${categoryId}`)
      .pipe(map(() => void 0));
  }
}