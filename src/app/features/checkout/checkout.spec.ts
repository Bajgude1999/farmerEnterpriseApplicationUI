import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { CheckoutComponent } from './checkout';
import { FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/ auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LocationService } from '../../core/services/location.service';
import { of } from 'rxjs';

describe('CheckoutComponent & Guest Flow & Online Payment', () => {
  let component: CheckoutComponent;
  let httpClientMock: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
  let authServiceMock: {
    hasValidSession: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof vi.fn>;
    userCd: ReturnType<typeof vi.fn>;
  };
  let cartServiceMock: {
    items: ReturnType<typeof vi.fn>;
    subtotal: ReturnType<typeof vi.fn>;
    deliveryCharge: ReturnType<typeof vi.fn>;
    total: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };
  let toastServiceMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let locationServiceMock: {
    getStates: ReturnType<typeof vi.fn>;
    getDistricts: ReturnType<typeof vi.fn>;
    getTalukas: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn().mockReturnValue(of({ data: [] })),
      post: vi.fn().mockReturnValue(of({ orderNumber: 'ORD-12345' })),
    };
    authServiceMock = {
      hasValidSession: vi.fn().mockReturnValue(false),
      currentUser: vi.fn().mockReturnValue(null),
      userCd: vi.fn().mockReturnValue(null),
    };
    cartServiceMock = {
      items: vi.fn().mockReturnValue([
        {
          product: { id: '10', name: 'NPK Fertilizer', price: 500, mrp: 600, uomCd: 1, packSize: 1 },
          quantity: 2,
        },
      ]),
      subtotal: vi.fn().mockReturnValue(1000),
      deliveryCharge: vi.fn().mockReturnValue(0),
      total: vi.fn().mockReturnValue(1000),
      clear: vi.fn(),
    };
    toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
    };
    locationServiceMock = {
      getStates: vi.fn().mockReturnValue(of([{ stateCd: 1, stateName: 'Maharashtra' }])),
      getDistricts: vi.fn().mockReturnValue(of([{ districtCd: 10, districtName: 'Pune' }])),
      getTalukas: vi.fn().mockReturnValue(of([{ talukaCd: 100, talukaName: 'Haveli' }])),
    };
    routerMock = {
      navigate: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: CheckoutComponent, useClass: CheckoutComponent },
        { provide: FormBuilder, useClass: FormBuilder },
        { provide: HttpClient, useValue: httpClientMock },
        { provide: Router, useValue: routerMock },
        { provide: CartService, useValue: cartServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: LocationService, useValue: locationServiceMock },
      ],
    });

    component = injector.get(CheckoutComponent);
  });

  it('should initialize for Guest User without showing address form immediately', () => {
    component.ngOnInit();
    expect(component.isLoggedIn()).toBe(false);
    expect(component.guestStepCompleted()).toBe(false);
    expect(component.isExistingGuest()).toBe(false);
  });

  it('should verify existing guest mobile number and reveal address form with isExistingGuest=true', () => {
    component.ngOnInit();
    component.addressForm.patchValue({ mobNo: '9876543210' });

    httpClientMock.get.mockReturnValue(
      of({
        data: [
          {
            userCd: 88,
            fullName: 'Rajesh Farmer',
            mobNo: '9876543210',
            email: 'rajesh@example.com',
            roleCd: 5,
          },
        ],
      })
    );

    component.checkGuestMobile();

    expect(component.guestStepCompleted()).toBe(true);
    expect(component.isExistingGuest()).toBe(true);
    expect(component.addressForm.get('userCd')?.value).toBe('88');
    expect(component.addressForm.get('fullName')?.valid).toBe(true);
  });

  it('should verify new guest mobile number and set isExistingGuest=false requiring fullName', () => {
    component.ngOnInit();
    component.addressForm.patchValue({ mobNo: '9812345678' });

    httpClientMock.get.mockReturnValue(of({ data: [] }));

    component.checkGuestMobile();

    expect(component.guestStepCompleted()).toBe(true);
    expect(component.isExistingGuest()).toBe(false);
    expect(component.addressForm.get('fullName')?.hasError('required')).toBe(true);
  });

  it('should toggle payment mode between COD and ONLINE', () => {
    expect(component.selectedPaymentMode()).toBe('COD');

    component.onPaymentModeChange('ONLINE');
    expect(component.selectedPaymentMode()).toBe('ONLINE');

    component.onPaymentModeChange('COD');
    expect(component.selectedPaymentMode()).toBe('COD');
  });

  it('should place order with selected payment mode ONLINE and taxes calculated', () => {
    authServiceMock.hasValidSession.mockReturnValue(true);
    authServiceMock.currentUser.mockReturnValue({
      userCd: 55,
      fullName: 'Suresh Patil',
      mobNo: '9988776655',
      addresses: [
        {
          village: 'Koregaon',
          state: 'Maharashtra',
          district: 'Satara',
          taluka: 'Koregaon',
          pin: '415501',
          address: 'Main Road',
        },
      ],
    });

    component.ngOnInit();
    component.onPaymentModeChange('ONLINE');

    // Mock calculate taxes response
    httpClientMock.post.mockImplementation((url: string, payload: any) => {
      if (url.includes('calculatetaxes')) {
        return of({
          data: [
            [
              { productCd: '10', taxName: 'BASIC', taxRate: 18, taxAmount: 180 },
            ],
          ],
        });
      }
      if (url.includes('order/save')) {
        return of({ orderNumber: 'ORD-ONLINE-999' });
      }
      return of({});
    });

    component.placeOrder();

    expect(httpClientMock.post).toHaveBeenCalledWith(
      expect.stringContaining('/v1/order/save'),
      expect.objectContaining({
        paymentMode: 'ONLINE',
        mobileNo: '9988776655',
        orderStatus: 'PLACED',
      })
    );

    expect(component.orderPlaced()).toBe(true);
    expect(component.orderNumber()).toBe('ORD-ONLINE-999');
    expect(cartServiceMock.clear).toHaveBeenCalled();
  });
});