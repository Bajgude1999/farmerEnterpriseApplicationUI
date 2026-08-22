import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService, parseJwtPayload, isJwtExpired } from './ auth.service';
import { of, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Http } from '../common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

// Setup mock Storage for Node/Vitest test environment
class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new MemoryStorage();
}
if (typeof globalThis.sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = new MemoryStorage();
}

function createTestJwt(expInSecondsFromNow: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + expInSecondsFromNow;
  const payload = btoa(JSON.stringify({ sub: 'testUser', userCd: 123, exp }));
  const signature = 'fakeSignature';
  return `${header}.${payload}.${signature}`;
}

describe('AuthService & JWT Utilities', () => {
  describe('JWT Utilities', () => {
    it('should parse JWT payload claims correctly', () => {
      const token = createTestJwt(3600);
      const payload = parseJwtPayload(token);
      expect(payload).toBeTruthy();
      expect(payload.userCd).toBe(123);
      expect(payload.sub).toBe('testUser');
    });

    it('should return null for malformed tokens', () => {
      expect(parseJwtPayload('invalid.token')).toBeNull();
      expect(parseJwtPayload('')).toBeNull();
    });

    it('should detect expired token', () => {
      const expiredToken = createTestJwt(-100);
      expect(isJwtExpired(expiredToken)).toBe(true);
    });

    it('should detect valid active token', () => {
      const validToken = createTestJwt(3600);
      expect(isJwtExpired(validToken)).toBe(false);
    });
  });

  describe('AuthService Session & Logout Management', () => {
    let service: AuthService;
    let httpClientMock: { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };
    let httpSecureMock: { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };
    let routerMock: { navigate: ReturnType<typeof vi.fn>; url: string };
    let dialogMock: { open: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();

      httpClientMock = {
        post: vi.fn().mockReturnValue(of({ status: 'SUCCESS' })),
        get: vi.fn().mockReturnValue(of({})),
      };
      httpSecureMock = {
        post: vi.fn().mockReturnValue(of({})),
        get: vi.fn().mockReturnValue(of({})),
      };
      routerMock = {
        navigate: vi.fn(),
        url: '/my-orders',
      };
      dialogMock = {
        open: vi.fn(),
      };

      const injector = Injector.create({
        providers: [
          { provide: AuthService, useClass: AuthService },
          { provide: HttpClient, useValue: httpClientMock },
          { provide: Http, useValue: httpSecureMock },
          { provide: Router, useValue: routerMock },
          { provide: MatDialog, useValue: dialogMock },
        ],
      });

      service = injector.get(AuthService);
    });

    afterEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('should return false for hasValidSession when no token or user exists', () => {
      expect(service.hasValidSession()).toBe(false);
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should clear all client auth storage on clearSession() without touching unrelated storage', () => {
      localStorage.setItem('fp_auth_token', 'encrypted-token');
      localStorage.setItem('fp_auth_user', 'encrypted-user');
      localStorage.setItem('fp_refresh_token', 'encrypted-refresh');
      localStorage.setItem('fp_lang', 'hi');

      service.clearSession();

      expect(localStorage.getItem('fp_auth_token')).toBeNull();
      expect(localStorage.getItem('fp_auth_user')).toBeNull();
      expect(localStorage.getItem('fp_refresh_token')).toBeNull();
      expect(localStorage.getItem('fp_lang')).toBe('hi');
      expect(service.currentUser()).toBeNull();
    });

    it('should execute logout flow, call /v1/logout API, clear session and navigate to /login', () => {
      const mockUser: User = {
        userCd: 55,
        fullName: 'Ramesh Farmer',
        mobNo: '9876543210',
      };
      (service as any).currentUserSignal.set(mockUser);

      service.logout('/my-orders');

      expect(httpClientMock.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/logout'),
        expect.objectContaining({
          mobNo: expect.any(String),
        })
      );

      expect(service.currentUser()).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/my-orders' },
      });
    });

    it('should not enter a loop if /v1/logout API returns HTTP 401', () => {
      httpClientMock.post.mockReturnValue(
        throwError(() => ({ status: 401, message: 'Unauthorized' }))
      );

      const mockUser: User = {
        userCd: 55,
        fullName: 'Ramesh Farmer',
        mobNo: '9876543210',
      };
      (service as any).currentUserSignal.set(mockUser);

      expect(() => service.logout()).not.toThrow();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], undefined);
    });

    it('should prevent concurrent multiple logout calls (anti-loop protection)', () => {
      const mockUser: User = {
        userCd: 55,
        fullName: 'Ramesh Farmer',
        mobNo: '9876543210',
      };
      (service as any).currentUserSignal.set(mockUser);

      // Simulate 3 rapid simultaneous 401 triggers
      service.handleUnauthorizedLogout('/my-orders');
      service.handleUnauthorizedLogout('/my-orders');
      service.handleUnauthorizedLogout('/my-orders');

      // Logout API should be dispatched at most once
      expect(httpClientMock.post).toHaveBeenCalledTimes(1);
    });

    it('should accurately compute isAdmin based on roleName or roleCd', () => {
      expect(service.isAdmin()).toBe(false);

      (service as any).currentUserSignal.set({ userCd: 1, fullName: 'Admin User', roleName: 'ADMIN' });
      expect(service.isAdmin()).toBe(true);

      (service as any).currentUserSignal.set({ userCd: 2, fullName: 'Staff User', roleCd: 2 });
      expect(service.isAdmin()).toBe(true);

      (service as any).currentUserSignal.set({ userCd: 3, fullName: 'Farmer User', roleName: 'FARMER', roleCd: 5 });
      expect(service.isAdmin()).toBe(false);
    });
  });
});
