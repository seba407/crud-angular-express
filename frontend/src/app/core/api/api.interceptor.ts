import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_URL } from './api.config';
import { ApiError } from './api-error';

/**
 * Para las peticiones a la API:
 * - agrega `Authorization: Bearer <token>` si hay sesión;
 * - convierte los errores HTTP en `ApiError` con el mensaje del backend;
 * - ante un 401 (token expirado o inválido) cierra la sesión y lleva al login.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);

  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

      // Un 401 del login son credenciales incorrectas, no una sesión vencida.
      if (err.status === 401 && token && !req.url.endsWith('/auth/login')) {
        auth.logout();
        router.navigateByUrl('/login');
      }
      return throwError(() => ApiError.fromHttp(err));
    }),
  );
};
