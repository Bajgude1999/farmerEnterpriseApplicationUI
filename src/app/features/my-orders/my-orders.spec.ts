import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { MyOrders } from './my-orders';
import { environment } from '../../../environments/environment/environment';
import { Order } from '../../core/models/cart.model';

const mockOrders: Order[] = [
  {
    id: '1', orderNumber: 'ORD-1', placedOn: '2026-07-01', status: 'PENDING',
    items: [{ productId: 'p1', productName: 'Urea', quantity: 2, price: 300 }],
    deliveryAddress: { fullName: 'A', mobile: '9999999999', village: 'V', taluka: 'T', district: 'D', state: 'S', pin: '111111' },
    paymentMode: 'COD', total: 600,
  },
  {
    id: '2', orderNumber: 'ORD-2', placedOn: '2026-07-02', status: 'DELIVERED',
    items: [{ productId: 'p2', productName: 'DAP', quantity: 1, price: 1200 }],
    deliveryAddress: { fullName: 'A', mobile: '9999999999', village: 'V', taluka: 'T', district: 'D', state: 'S', pin: '111111' },
    paymentMode: 'COD', total: 1200,
  },
];

describe('MyOrders', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyOrders],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideTranslateService()],
    }).compileComponents();
  });

  it('should filter orders by the active tab status', () => {
    const fixture = TestBed.createComponent(MyOrders);
    const httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/orders/my`);
    req.flush(mockOrders);

    expect(fixture.componentInstance.filteredOrders().length).toBe(1);
    expect(fixture.componentInstance.filteredOrders()[0].orderNumber).toBe('ORD-1');

    fixture.componentInstance.onTabChange(2); // DELIVERED
    expect(fixture.componentInstance.filteredOrders()[0].orderNumber).toBe('ORD-2');

    httpMock.verify();
  });
});