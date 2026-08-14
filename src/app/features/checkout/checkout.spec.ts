import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { CheckoutComponent } from './checkout';
import { environment } from '../../../environments/environment/environment';

describe('CheckoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideTranslateService()],
    }).compileComponents();
  });

  it('should not place an order with an invalid address form', () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    fixture.componentInstance.placeOrder();
    expect(fixture.componentInstance.addressForm.invalid).toBe(true);
  });

  it('should place an order and clear the cart on success', () => {
    const fixture = TestBed.createComponent(CheckoutComponent);
    const httpMock = TestBed.inject(HttpTestingController);

    fixture.componentInstance.addressForm.setValue({
      fullName: 'Ramesh Patil',
      mobile: '9876543210',
      village: 'Kukkadgaon',
      taluka: 'Beed',
      district: 'Beed',
      state: 'Maharashtra',
      pin: '431122',
    });

    fixture.componentInstance.placeOrder();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/orders`);
    req.flush({ orderNumber: 'ORD-1001' });

    expect(fixture.componentInstance.orderPlaced()).toBe(true);
    expect(fixture.componentInstance.orderNumber()).toBe('ORD-1001');
    httpMock.verify();
  });
});