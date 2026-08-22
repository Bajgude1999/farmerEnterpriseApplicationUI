import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, adminGuard } from './auth.guard';
import { AuthService } from '../services/ auth.service';
import { Injector, runInInjectionContext } from '@angular/core';

describe('Route Guards (authGuard & adminGuard)', () => {
  let authServiceMock: {
    hasValidSession: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };
  let injector: Injector;
  let dummyRoute: ActivatedRouteSnapshot;
  let dummyState: RouterStateSnapshot;

  beforeEach(() => {
    authServiceMock = {
      hasValidSession: vi.fn(),
      clearSession: vi.fn(),
      currentUser: vi.fn(),
    };
    routerMock = {
      createUrlTree: vi.fn().mockImplementation((commands, extras) => ({
        commands,
        extras,
      })),
    };

    dummyRoute = {} as ActivatedRouteSnapshot;
    dummyState = { url: '/my-orders' } as RouterStateSnapshot;

    injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  describe('authGuard', () => {
    it('should allow navigation when session is valid and not expired', () => {
      authServiceMock.hasValidSession.mockReturnValue(true);

      const result = runInInjectionContext(injector, () => authGuard(dummyRoute, dummyState));
      expect(result).toBe(true);
      expect(authServiceMock.clearSession).not.toHaveBeenCalled();
    });

    it('should clear session and redirect to /login with returnUrl when session is invalid or expired', () => {
      authServiceMock.hasValidSession.mockReturnValue(false);

      const result: any = runInInjectionContext(injector, () => authGuard(dummyRoute, dummyState));
      expect(authServiceMock.clearSession).toHaveBeenCalled();
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/my-orders' },
      });
      expect(result.commands).toEqual(['/login']);
    });
  });

  describe('adminGuard', () => {
    it('should allow navigation when user is logged in with ADMIN role', () => {
      authServiceMock.hasValidSession.mockReturnValue(true);
      authServiceMock.currentUser.mockReturnValue({
        userCd: 1,
        fullName: 'Admin User',
        roleName: 'ADMIN',
        roleCd: 2,
      });

      const result = runInInjectionContext(injector, () => adminGuard(dummyRoute, dummyState));
      expect(result).toBe(true);
    });

    it('should redirect non-admin logged-in user to /unauthorized', () => {
      authServiceMock.hasValidSession.mockReturnValue(true);
      authServiceMock.currentUser.mockReturnValue({
        userCd: 2,
        fullName: 'Regular Farmer',
        roleName: 'CUSTOMER',
        roleCd: 5,
      });

      const result: any = runInInjectionContext(injector, () => adminGuard(dummyRoute, dummyState));
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
      expect(result.commands).toEqual(['/unauthorized']);
    });

    it('should redirect unauthenticated user to /login', () => {
      authServiceMock.hasValidSession.mockReturnValue(false);

      const result: any = runInInjectionContext(injector, () => adminGuard(dummyRoute, dummyState));
      expect(authServiceMock.clearSession).toHaveBeenCalled();
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/my-orders' },
      });
    });
  });
});
