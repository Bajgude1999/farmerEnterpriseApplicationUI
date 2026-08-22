import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoleOption } from '../models/user.model';
import { Http } from '../common/http';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(Http);

  getAll(): Observable<RoleOption[]> {
    return this.http
      .get<{ data: RoleOption[] }>(`${environment.apiBaseUrl}/v1/role/get-all`)
      .pipe(map((res) => res.data ?? []));
  }
}