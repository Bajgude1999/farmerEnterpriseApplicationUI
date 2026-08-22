import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Http } from '../../../common/http';
import {
  SalesSummaryReport,
  PurchaseSummaryReport,
  ProfitMarginReport,
  OrderSummaryReport,
} from '../../../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(Http);

  getSalesSummary(
    fromDate?: string,
    toDate?: string,
    groupBy: 'DAY' | 'MONTH' | 'YEAR' = 'DAY'
  ): Observable<SalesSummaryReport> {
    const params: string[] = [];
    if (fromDate) params.push(`fromDate=${encodeURIComponent(fromDate)}`);
    if (toDate) params.push(`toDate=${encodeURIComponent(toDate)}`);
    if (groupBy) params.push(`groupBy=${encodeURIComponent(groupBy)}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';

    return this.http
      .get<{ data: SalesSummaryReport[] }>(
        `${environment.apiBaseUrl}/v1/report/sales-summary${query}`
      )
      .pipe(map((res) => res.data?.[0]));
  }

  getPurchaseSummary(
    fromDate?: string,
    toDate?: string,
    supplier?: string
  ): Observable<PurchaseSummaryReport> {
    const params: string[] = [];
    if (fromDate) params.push(`fromDate=${encodeURIComponent(fromDate)}`);
    if (toDate) params.push(`toDate=${encodeURIComponent(toDate)}`);
    if (supplier) params.push(`supplier=${encodeURIComponent(supplier)}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';

    return this.http
      .get<{ data: PurchaseSummaryReport[] }>(
        `${environment.apiBaseUrl}/v1/report/purchase-summary${query}`
      )
      .pipe(map((res) => res.data?.[0]));
  }

  getProfitMargin(
    fromDate?: string,
    toDate?: string
  ): Observable<ProfitMarginReport> {
    const params: string[] = [];
    if (fromDate) params.push(`fromDate=${encodeURIComponent(fromDate)}`);
    if (toDate) params.push(`toDate=${encodeURIComponent(toDate)}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';

    return this.http
      .get<{ data: ProfitMarginReport[] }>(
        `${environment.apiBaseUrl}/v1/report/profit-margin${query}`
      )
      .pipe(map((res) => res.data?.[0]));
  }

  getOrderSummary(
    fromDate?: string,
    toDate?: string
  ): Observable<OrderSummaryReport> {
    const params: string[] = [];
    if (fromDate) params.push(`fromDate=${encodeURIComponent(fromDate)}`);
    if (toDate) params.push(`toDate=${encodeURIComponent(toDate)}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';

    return this.http
      .get<{ data: OrderSummaryReport[] }>(
        `${environment.apiBaseUrl}/v1/report/order-summary${query}`
      )
      .pipe(map((res) => res.data?.[0]));
  }
}
