import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AvailableBatch, SalesOrder } from '../../../models/sales-order.model';
import { Http } from '../../../common/http';


@Injectable({ providedIn: 'root' })
export class SalesOrderService {
  private http = inject(Http);
  private base = `${environment.apiBaseUrl}/v1/salesorder`;


  getAll(): Observable<SalesOrder[]> {
    return this.http.get<{ data: SalesOrder[] }>(`${this.base}/get-all`).pipe(map((res) => res.data ?? []));
  }

  getById(orderCd: number): Observable<SalesOrder> {
  return this.http
    .get<{ data: SalesOrder[] }>(`${this.base}/${orderCd}`)
    .pipe(
      map((res) => res.data?.[0])
    );
  }

  save(payload: SalesOrder): Observable<unknown> {
    return this.http.post(`${this.base}/save`, payload);
  }
  update(payload: SalesOrder): Observable<unknown> {
    return this.http.put(`${this.base}/update`, payload);
  }
  getAvailableBatches(
  productCd: number,
  whCd: number
): Observable<AvailableBatch[]> {

  return this.http.get<AvailableBatch[]>(
    `${environment.apiBaseUrl}/v1/stock/available-batch/${productCd}/${whCd}`
  );
}

}