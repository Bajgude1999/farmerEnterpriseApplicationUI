import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment/environment';
import { UserMaster } from '../../../models/user.model';
import { Http } from '../../../common/http';

@Injectable({ providedIn: 'root' })
export class UserMasterService {
  private http = inject(Http);
  private base = `${environment.apiBaseUrl}/v1/user`;

  getAll(): Observable<UserMaster[]> {
    return this.http.get<{ data: UserMaster[] }>(`${this.base}/get-all`).pipe(map((res) => res.data ?? []));
  }
getAllActiveUserByRoleCode(roleCd: number): Observable<UserMaster[]> {

  return this.http
    .get<{ data: UserMaster[] }>(
      `${this.base}/get-by-role/${roleCd}`
    )
    .pipe(
      map((res) => res.data ?? [])
    );
}
  getById(userId: number): Observable<UserMaster> {
    return this.http.get<{ data: UserMaster }>(`${this.base}/${userId}`).pipe(map((res) => res.data));
  }

  save(payload: UserMaster): Observable<unknown> {
    return this.http.post(`${this.base}/save`, payload);
  }
}