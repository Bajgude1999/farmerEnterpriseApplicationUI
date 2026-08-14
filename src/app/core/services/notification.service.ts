import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment/environment';
import { AppNotification } from '../models/notification.model';
import { Http } from '../common/http';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(Http);

 getAll(userCd: number, roleCd: number): Observable<AppNotification[]> {

  return this.http.getWithPayload<AppNotification[]>(
    `${environment.apiBaseUrl}/v1/notification/get-all`,
    {
      userCd: userCd.toString(),
      roleCd: roleCd.toString()
    }
  );
}

 
markRead(notiRecipientId: number): Observable<string> {

  return this.http.putWithPayload(
    `${environment.apiBaseUrl}/v1/notification/read`,
    null,
    {
        notiRecipientId: notiRecipientId.toString()
  
    }
  );
}


}