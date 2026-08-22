import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { extractErrorMessage } from '../models/api-response.model';
import { AuthService } from '../services/ auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Global HTTP error interceptor that extracts backend error messages and
 * surfaces them via the themed ToastService while handling auth redirects.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const isExcludedFrom401Redirect = (url: string): boolean => {
    return (environment.authErrorExcludedUrls ?? []).some((pattern: string) => {
      if (pattern.endsWith('/**')) {
        const baseUrl = pattern.substring(0, pattern.length - 3);
        return url.includes(baseUrl);
      }
      return url.includes(pattern);
    });
  };

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = extractErrorMessage(error);

      switch (error.status) {
        case 400:
          // 400 Bad Request: display specific validation or business constraint message
          toastService.error(message);
          break;

        case 401:
          // 401 Unauthorized: authentication failure
          if (!isExcludedFrom401Redirect(req.url)) {
            toastService.error(message);
            authService.clearSessionAndRedirect();
          }
          break;

        case 403:
          // 403 Forbidden: authorization / permission denied
          toastService.error(message || 'Access Denied: You do not have permission to perform this action.');
          break;

        case 404:
          // 404 Not Found: resource not found
          toastService.error(message);
          break;

        case 409:
          // 409 Conflict: duplicate record or constraint conflict
          toastService.error(message);
          break;

        case 500:
          // 500 Internal Server Error: show backend message if provided, else standard server error
          toastService.error(message || 'Internal server error occurred. Please try again later.');
          break;

        default:
          // Network errors (status 0) and unhandled codes
          toastService.error(message);
          break;
      }

      return throwError(() => error);
    })
  );
};
