import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../services/ auth.service';
import { Injector, runInInjectionContext } from '@angular/core';

describe('authInterceptor', () => {
  let authServiceMock: {
    token: string | null;
    isTokenExpired: ReturnType<typeof vi.fn>;
    handleUnauthorizedLogout: ReturnType<typeof vi.fn>;
  };
  let injector: Injector;

  beforeEach(() => {
    authServiceMock = {
      token: 'valid-decrypted-jwt-token',
      isTokenExpired: vi.fn().mockReturnValue(false),
      handleUnauthorizedLogout: vi.fn(),
    };

    injector = Injector.create({
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    });
  });

  function executeInterceptor(req: HttpRequest<any>, next: HttpHandlerFn) {
    return runInInjectionContext(injector, () => authInterceptor(req, next));
  }

  it('should attach Authorization Bearer header to protected requests when token is valid', async () => {
    const req = new HttpRequest('GET', '/v1/user/profile');
    let forwardedReq: HttpRequest<any> | null = null;

    const next: HttpHandlerFn = (r) => {
      forwardedReq = r;
      return of({} as any);
    };

    await executeInterceptor(req, next).toPromise();

    expect(forwardedReq).toBeTruthy();
    expect((forwardedReq as any).headers.get('Authorization')).toBe('Bearer valid-decrypted-jwt-token');
    expect(authServiceMock.handleUnauthorizedLogout).not.toHaveBeenCalled();
  });

  it('should not send expired token, should trigger logout and throw 401 error', async () => {
    authServiceMock.isTokenExpired.mockReturnValue(true);

    const req = new HttpRequest('GET', '/v1/user/profile');
    const next: HttpHandlerFn = vi.fn();

    let errorThrown: any = null;
    try {
      await executeInterceptor(req, next).toPromise();
    } catch (err) {
      errorThrown = err;
    }

    expect(next).not.toHaveBeenCalled();
    expect(authServiceMock.handleUnauthorizedLogout).toHaveBeenCalled();
    expect(errorThrown).toBeInstanceOf(HttpErrorResponse);
    expect(errorThrown.status).toBe(401);
  });

  it('should pass public API requests through without attaching Authorization header', async () => {
    const req = new HttpRequest('GET', '/v1/token');
    let forwardedReq: HttpRequest<any> | null = null;

    const next: HttpHandlerFn = (r) => {
      forwardedReq = r;
      return of({} as any);
    };

    await executeInterceptor(req, next).toPromise();

    expect(forwardedReq).toBeTruthy();
    expect((forwardedReq as any).headers.has('Authorization')).toBe(false);
  });
});
