import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { PurchaseSummaryReportComponent } from './purchase-summary-report';
import { ReportService } from '../../shared/report.service';

describe('PurchaseSummaryReportComponent', () => {
  let component: PurchaseSummaryReportComponent;
  let reportServiceMock: { getPurchaseSummary: ReturnType<typeof vi.fn> };

  const mockReport = {
    totalGrnCount: 2,
    totalPurchaseValue: 80000,
    rows: [
      { grnDate: '2026-08-20', grnNo: 'GRN-001', supplierName: 'Agro Supplier A', invoiceNo: 'INV-101', invoiceDate: '2026-08-19', totalAmount: 40000, grnStatus: 'COMPLETED' },
      { grnDate: '2026-08-21', grnNo: 'GRN-002', supplierName: 'Agro Supplier B', invoiceNo: 'INV-102', invoiceDate: '2026-08-20', totalAmount: 40000, grnStatus: 'COMPLETED' },
    ],
  };

  beforeEach(() => {
    reportServiceMock = {
      getPurchaseSummary: vi.fn().mockReturnValue(of(mockReport)),
    };

    const injector = Injector.create({
      providers: [
        { provide: PurchaseSummaryReportComponent, useClass: PurchaseSummaryReportComponent },
        { provide: FormBuilder, useClass: FormBuilder },
        { provide: ReportService, useValue: reportServiceMock },
      ],
    });

    component = injector.get(PurchaseSummaryReportComponent);
  });

  it('should initialize filters and fetch purchase summary report', () => {
    component.ngOnInit();
    expect(reportServiceMock.getPurchaseSummary).toHaveBeenCalled();
    expect(component.reportData()).toEqual(mockReport);
    expect(component.loading()).toBe(false);
  });
});
