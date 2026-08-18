import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  catchError,
  throwError
} from 'rxjs';


// =====================================================
// STORAGE KEYS
// =====================================================

const TOKEN_KEY = 'fp_auth_token';
const USER_KEY = 'fp_user';


// =====================================================
// PUBLIC API PATTERNS
// =====================================================

const PUBLIC_API_PATTERNS: string[] = [

  // ===================================================
  // TOKEN / AUTH
  // ===================================================

  '/v1/token',
  '/v1/logout',
  '/v1/refreshToken',
  '/forget/password',


  // ===================================================
  // ROLE
  // ===================================================

  '/v1/role/get-all',


  // ===================================================
  // ENCRYPT / DECRYPT
  // ===================================================

  '/v1/encrypt',
  '/v1/decrypt',


  // ===================================================
  // PRODUCT
  // ===================================================

  '/v1/product/get-all',
  '/v1/product/',
  '/v1/products/search',


  // ===================================================
  // USER
  // ===================================================

  '/v1/user/save',
  '/v1/user/get-by-mobile/',


  // ===================================================
  // ORDER
  // ===================================================

  '/v1/order/calculatetaxes',
  '/v1/order/save',


  // ===================================================
  // CATEGORY / BRAND
  // ===================================================

  '/v1/category/get-all',
  '/v1/brand/get-all',


  // ===================================================
  // LOCATION
  // ===================================================

  '/v1/location/states',
  '/v1/location/districts/',
  '/v1/location/talukas/'

];


// =====================================================
// AUTH INTERCEPTOR
// =====================================================

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);

  const token =
    localStorage.getItem(TOKEN_KEY);

  const isPublicApi =
    isPublicRequest(req.url);


  // ===================================================
  // REQUEST
  // ===================================================

  let authReq = req;


  // Add JWT only to protected APIs
  if (!isPublicApi && token) {

    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

  }


  // ===================================================
  // SEND REQUEST
  // ===================================================

  return next(authReq).pipe(

    catchError((error: HttpErrorResponse) => {


      // =================================================
      // UNAUTHORIZED
      // =================================================

      if (
        error.status === 401 &&
        !isPublicApi
      ) {

        clearSession();


        // Avoid redirect loop
        if (router.url !== '/login') {

          router.navigate(['/login']);

        }

      }


      return throwError(() => error);

    })

  );

};


// =====================================================
// CHECK PUBLIC API
// =====================================================

function isPublicRequest(url: string): boolean {

  return PUBLIC_API_PATTERNS.some(
    pattern => url.includes(pattern)
  );

}


// =====================================================
// CLEAR SESSION
// =====================================================

function clearSession(): void {

  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(USER_KEY);

}