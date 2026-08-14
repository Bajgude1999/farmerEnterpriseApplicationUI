import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  return true;
};

export const adminGuard: CanActivateFn = (route, state) => {
  return true;
};
