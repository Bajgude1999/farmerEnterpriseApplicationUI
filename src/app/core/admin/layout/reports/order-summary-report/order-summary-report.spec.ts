import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { OrderSummaryReportComponent } from './order-summary-report';
import { ReportService } from '../../shared/report.service';

describe('OrderSummaryReportComponent', () => {
  let component: OrderSummaryReportComponent;
  let reportServiceMock: { getOrderSummary: ReturnType<typeof vi.fn> };

  const mockReport = {
    totalOrders: 15,
    pendingOrders: 3,
    confirmedOrders: 5,
    shippedOrders: 2,
    deliveredOrders: 4,
    cancelledOrders: 1,
    totalOrderValue: 75000,
    statusBreakdown: [
      { status: 'CONFIRMED', count: 5, totalAmount: 25000 },
      { status: 'DELIVERED', count: 4, totalAmount: 20000 },
    ],
  };

  beforeEach(() => {
    reportServiceMock = {
      getOrderSummary: vi.fn().mockReturnValue(of(mockReport)),
    };

    const injector = Injector.create({
      providers: [
        { provide: OrderSummaryReportComponent, useClass: OrderSummaryReportComponent },
        { provide: FormBuilder, useClass: FormBuilder },
        { provide: ReportService, useValue: reportServiceMock },
      ],
    });

    component = injector.get(OrderSummaryReportComponent);
  });

  it('should initialize filters and fetch order summary report', () => {
    component.ngOnInit();
    expect(reportServiceMock.getOrderSummary).toHaveBeenCalled();
    expect(component.reportData()).toEqual(mockReport);
    expect(component.loading()).toBe(false);
  });
});
