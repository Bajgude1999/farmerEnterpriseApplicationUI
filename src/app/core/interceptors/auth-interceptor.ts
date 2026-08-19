import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/ auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);

  const isExcludedFrom401Redirect = (url: string): boolean => {

    return environment.authErrorExcludedUrls.some(pattern => {

      // Handle /** wildcard
      if (pattern.endsWith('/**')) {
        const baseUrl = pattern.substring(0, pattern.length - 3);
        return url.includes(baseUrl);
      }

      return url.includes(pattern);
    });
  };

  return next(req).pipe(

    catchError((error) => {

      if (
        error.status === 401 &&
        !isExcludedFrom401Redirect(req.url)
      ) {

        authService.clearSessionAndRedirect();

      }

      return throwError(() => error);
    })

  );
};