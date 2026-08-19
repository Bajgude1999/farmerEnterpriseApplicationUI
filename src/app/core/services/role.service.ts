import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoleOption } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);

  getAll(): Observable<RoleOption[]> {
    return this.http.get<RoleOption[]>(`${environment.apiBaseUrl}/v1/role/get-all`);
  }
}