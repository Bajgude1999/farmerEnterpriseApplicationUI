import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/notification.model';
import { Http } from '../common/http';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(Http);
  private base = `${environment.apiBaseUrl}/v1/notification`;
  getAll(userCd: number, roleCd: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.base}/get-all?userCd=${userCd}&roleCd=${roleCd}`);
  }

  markRead(notiRecipientId: number): Observable<unknown> {
    return this.http.put(`${this.base}/read?notiRecipientId=${notiRecipientId}`, null);
  }

  markAllRead(userCd: number): Observable<unknown> {
    return this.http.put(`${this.base}/read-all?userCd=${userCd}`, null);
  }
  delete(notiRecipientId: number): Observable<unknown> {
    return this.http.put(`${this.base}/delete?notiRecipientId=${notiRecipientId}`, null);
  }

  deleteAll(userCd: number): Observable<unknown> {
    return this.http.put(`${this.base}/delete-all?userCd=${userCd}`, null);
  }
}