import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { authToken, clearAuth } from '../store/auth.store';

/**
 * authInterceptor — inyección centralizada del JWT y gestión de sesión.
 *
 * El token se envía como header estándar:
 *   Authorization: Bearer <token>
 *
 * Reglas:
 *  1. Si no hay token en el store → la petición pasa sin modificar
 *     (cubre el endpoint público POST /auth/login).
 *  2. Si la petición ya lleva el header Authorization (ej. la llamada
 *     a /users/me durante el login, antes de que el token esté en el store)
 *     → no sobreescribir.
 *  3. En cualquier otro caso → clona la request e inyecta el header.
 *  4. Si el servidor responde 401 → token inválido o caducado: limpia el
 *     store y redirige al login automáticamente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token  = authToken();

  // Sin token o la request ya trae su propio Authorization
  if (!token || req.headers.has('Authorization')) {
    return next(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          clearAuth();
          router.navigate(['/login']);
        }
        return throwError(() => err);
      }),
    );
  }

  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        clearAuth();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
