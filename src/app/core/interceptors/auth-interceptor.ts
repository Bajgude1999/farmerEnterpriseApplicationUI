import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/ auth.service';

/**
 * Auth Interceptor that:
 * 1. Checks if a protected request has an expired token before dispatching.
 * 2. If expired, halts outgoing request and triggers session cleanup & logout redirect.
 * 3. Otherwise attaches the decrypted Bearer token header to the outgoing request.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isExcludedFromAuth = (url: string): boolean => {
    return (environment.authErrorExcludedUrls ?? []).some((pattern: string) => {
      if (pattern.endsWith('/**')) {
        const baseUrl = pattern.substring(0, pattern.length - 3);
        return url.includes(baseUrl);
      }
      return url.includes(pattern);
    });
  };

  const isExcluded = isExcludedFromAuth(req.url);

  // If endpoint is protected and token exists
  if (!isExcluded) {
    const token = authService.token;

    if (token) {
      // Pre-flight check: if token is already expired, do not send it
      if (authService.isTokenExpired()) {
        authService.handleUnauthorizedLogout();
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 401,
              statusText: 'Unauthorized',
              error: {
                status: {
                  status: 'FAILED',
                  message: 'Authentication session expired. Please sign in again.',
                },
              },
            })
        );
      }

      if (!req.headers.has('Authorization')) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        return next(authReq);
      }
    }
  }

  return next(req);
};