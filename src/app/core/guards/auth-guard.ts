import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/ auth.service';

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  if (user) {
    return true;
  }

  return router.createUrlTree(['/login']);
};


export const adminGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  // User is not logged in
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // User is logged in but is not admin
  if (user.roleName !== 'ADMIN') {
    return router.createUrlTree(['/unauthorized']);
  }

  return true;
};