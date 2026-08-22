import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { SalesSummaryReportComponent } from './sales-summary-report';
import { ReportService } from '../../shared/report.service';

describe('SalesSummaryReportComponent', () => {
  let component: SalesSummaryReportComponent;
  let reportServiceMock: { getSalesSummary: ReturnType<typeof vi.fn> };

  const mockReport = {
    totalOrders: 10,
    totalGrossAmount: 50000,
    totalDiscountAmount: 5000,
    totalNetAmount: 45000,
    rows: [
      { period: '2026-08-20', orderCount: 5, totalGrossAmount: 25000, totalDiscountAmount: 2500, totalNetAmount: 22500 },
      { period: '2026-08-21', orderCount: 5, totalGrossAmount: 25000, totalDiscountAmount: 2500, totalNetAmount: 22500 },
    ],
  };

  beforeEach(() => {
    reportServiceMock = {
      getSalesSummary: vi.fn().mockReturnValue(of(mockReport)),
    };

    const injector = Injector.create({
      providers: [
        { provide: SalesSummaryReportComponent, useClass: SalesSummaryReportComponent },
        { provide: FormBuilder, useClass: FormBuilder },
        { provide: ReportService, useValue: reportServiceMock },
      ],
    });

    component = injector.get(SalesSummaryReportComponent);
  });

  it('should initialize filters and fetch report', () => {
    component.ngOnInit();
    expect(reportServiceMock.getSalesSummary).toHaveBeenCalled();
    expect(component.reportData()).toEqual(mockReport);
    expect(component.loading()).toBe(false);
  });
});
