import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpRequest, HttpErrorResponse, HttpHandlerFn } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { errorInterceptor } from './error-interceptor';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/ auth.service';
import { Router } from '@angular/router';
import { Injector, runInInjectionContext } from '@angular/core';

describe('errorInterceptor', () => {
  let toastServiceMock: { error: ReturnType<typeof vi.fn> };
  let authServiceMock: { clearSessionAndRedirect: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let injector: Injector;

  beforeEach(() => {
    toastServiceMock = { error: vi.fn() };
    authServiceMock = { clearSessionAndRedirect: vi.fn() };
    routerMock = { navigate: vi.fn() };

    injector = Injector.create({
      providers: [
        { provide: ToastService, useValue: toastServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  function executeInterceptor(req: HttpRequest<any>, next: HttpHandlerFn) {
    return runInInjectionContext(injector, () => errorInterceptor(req, next));
  }

  it('should intercept 400 validation error and display backend message via ToastService', async () => {
    const req = new HttpRequest('GET', '/api/product/save');
    const httpError = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      error: {
        requestId: 'req-101',
        operationMode: 'VALIDATION',
        status: {
          timestamp: '21-08-2026',
          status: 'FAILED',
          message: 'Invalid product details: Pack size is required',
        },
        data: [],
      },
    });

    const next: HttpHandlerFn = () => throwError(() => httpError);

    try {
      await executeInterceptor(req, next).toPromise();
    } catch {
      // Expected to re-throw
    }

    expect(toastServiceMock.error).toHaveBeenCalledWith('Invalid product details: Pack size is required');
  });

  it('should intercept 401 unauthorized error and clear session and redirect', async () => {
    const req = new HttpRequest('GET', '/api/v1/protected-endpoint');
    const httpError = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: {
        status: {
          message: 'JWT Token expired or invalid',
          status: 'FAILED',
        },
      },
    });

    const next: HttpHandlerFn = () => throwError(() => httpError);

    try {
      await executeInterceptor(req, next).toPromise();
    } catch {}

    expect(toastServiceMock.error).toHaveBeenCalledWith('JWT Token expired or invalid');
    expect(authServiceMock.clearSessionAndRedirect).toHaveBeenCalled();
  });

  it('should intercept 403 forbidden error and display access denied message', async () => {
    const req = new HttpRequest('GET', '/api/admin/dashboard');
    const httpError = new HttpErrorResponse({
      status: 403,
      statusText: 'Forbidden',
      error: {
        status: {
          message: 'Access Denied: You do not have permission to perform this action.',
          status: 'FAILED',
        },
      },
    });

    const next: HttpHandlerFn = () => throwError(() => httpError);

    try {
      await executeInterceptor(req, next).toPromise();
    } catch {}

    expect(toastServiceMock.error).toHaveBeenCalledWith(
      'Access Denied: You do not have permission to perform this action.'
    );
  });

  it('should intercept 404 not found error and display backend message', async () => {
    const req = new HttpRequest('GET', '/api/v1/product/get/999');
    const httpError = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
      error: {
        message: 'Product not found',
        status: 'FAILED',
      },
    });

    const next: HttpHandlerFn = () => throwError(() => httpError);

    try {
      await executeInterceptor(req, next).toPromise();
    } catch {}

    expect(toastServiceMock.error).toHaveBeenCalledWith('Product not found');
  });

  it('should intercept 409 conflict error and display duplicate record message', async () => {
    const req = new HttpRequest('POST', '/api/v1/user/save');
    const httpError = new HttpErrorResponse({
      status: 409,
      statusText: 'Conflict',
      error: {
        status: {
          message: 'User already exists with this mobile number',
          status: 'FAILED',
        },
      },
    });

    const next: HttpHandlerFn = () => throwError(() => httpError);

    try {
      await executeInterceptor(req, next).toPromise();
    } catch {}

    expect(toastServiceMock.error).toHaveBeenCalledWith('User already exists with this mobile number');
  });

  it('should intercept 500 internal server error and display backend message or fallback', async () => {
    const req = new HttpRequest('GET', '/api/v1/report/stock');
    const httpError = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
      error: {
        status: {
          message: 'Database query execution error. Please contact administrator.',
          status: 'FAILED',
        },
      },
    });

    const next: HttpHandlerFn = () => throwError(() => httpError);

    try {
      await executeInterceptor(req, next).toPromise();
    } catch {}

    expect(toastServiceMock.error).toHaveBeenCalledWith(
      'Database query execution error. Please contact administrator.'
    );
  });

  it('should intercept network failure (status 0) and display network error message', async () => {
    const req = new HttpRequest('GET', '/api/v1/products');
    const httpError = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      error: { type: 'error' },
    });

    const next: HttpHandlerFn = () => throwError(() => httpError);

    try {
      await executeInterceptor(req, next).toPromise();
    } catch {}

    expect(toastServiceMock.error).toHaveBeenCalledWith(
      'Unable to connect to the server. Please check your internet connection.'
    );
  });
});
