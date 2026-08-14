import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment/environment';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  getAll(): Observable<Category[]> {
    return this.http
      .get<{ data: Category[] }>(`${environment.apiBaseUrl}/v1/category/get-all`)
      .pipe(map((res) => res.data ?? []));
  }
}