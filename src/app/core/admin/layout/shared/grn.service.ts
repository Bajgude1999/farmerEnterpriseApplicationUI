import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { GrnHdr } from './grn.model';
import { Http } from '../../../common/http';

@Injectable({ providedIn: 'root' })
export class GrnService {
  private http = inject(Http);
  private base = `${environment.apiBaseUrl}/v1/grn`;

  getAll(): Observable<GrnHdr[]> {
    return this.http.get<{ data: GrnHdr[] }>(`${this.base}/all`).pipe(map((res) => res.data ?? []));
  }

 getById(grnCd: number): Observable<GrnHdr> {
  return this.http
    .get<{ data: GrnHdr[] }>(`${this.base}/${grnCd}`)
    .pipe(
      map(res => res.data?.[0])
    );
}
  save(payload: GrnHdr): Observable<unknown> {
    if(payload.grnCd){
  return this.http.put(`${this.base}/update`, payload);
}else{
  return this.http.post(`${this.base}/save`, payload);
}
  }
}