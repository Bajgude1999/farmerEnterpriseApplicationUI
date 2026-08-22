import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { ProfitMarginReportComponent } from './profit-margin-report';
import { ReportService } from '../../shared/report.service';

describe('ProfitMarginReportComponent', () => {
  let component: ProfitMarginReportComponent;
  let reportServiceMock: { getProfitMargin: ReturnType<typeof vi.fn> };

  const mockReport = {
    totalSales: 100000,
    totalPurchase: 70000,
    totalProfit: 30000,
    overallMarginPercentage: 30,
    rows: [
      { period: '2026-08', salesAmount: 100000, purchaseCost: 70000, profitAmount: 30000, marginPercentage: 30 },
    ],
  };

  beforeEach(() => {
    reportServiceMock = {
      getProfitMargin: vi.fn().mockReturnValue(of(mockReport)),
    };

    const injector = Injector.create({
      providers: [
        { provide: ProfitMarginReportComponent, useClass: ProfitMarginReportComponent },
        { provide: FormBuilder, useClass: FormBuilder },
        { provide: ReportService, useValue: reportServiceMock },
      ],
    });

    component = injector.get(ProfitMarginReportComponent);
  });

  it('should initialize filters and fetch profit margin report', () => {
    component.ngOnInit();
    expect(reportServiceMock.getProfitMargin).toHaveBeenCalled();
    expect(component.reportData()).toEqual(mockReport);
    expect(component.loading()).toBe(false);
  });
});
