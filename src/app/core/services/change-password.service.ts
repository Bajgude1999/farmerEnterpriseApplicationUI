import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Http } from '../common/http';

export interface ChangePasswordRequest {
  userName: string;
  oldPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class ChangePasswordService {
  private http = inject(Http);

  changePassword(payload: ChangePasswordRequest): Observable<unknown> {
    return this.http.post(`${environment.apiBaseUrl}/v1/change-password`, payload);
  }
}