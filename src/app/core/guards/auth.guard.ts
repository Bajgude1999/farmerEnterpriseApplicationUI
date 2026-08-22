import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/ auth.service';

/**
 * Route guard that validates whether the user has an active, non-expired authentication session.
 * If invalid or expired, clears session and redirects to /login preserving the returnUrl.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasValidSession()) {
    return true;
  }

  // Session is invalid or token is expired
  auth.clearSession();

  const queryParams =
    state.url && state.url !== '/login' && state.url !== '/unauthorized'
      ? { returnUrl: state.url }
      : undefined;

  return router.createUrlTree(['/login'], queryParams ? { queryParams } : undefined);
};

/**
 * Route guard that requires an active session with an ADMIN role (roleName === 'ADMIN' or roleCd === 2).
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasValidSession()) {
    auth.clearSession();
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const user = auth.currentUser();
  if (user?.roleName !== 'ADMIN' && user?.roleCd !== 2) {
    return router.createUrlTree(['/unauthorized']);
  }

  return true;
};