import { HttpInterceptorFn } from '@angular/common/http';
import { authToken } from '../store/auth.store';

/**
 * authInterceptor — inyección centralizada del JWT.
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
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = authToken();

  // Sin token o la request ya trae su propio Authorization
  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }

  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(authReq);
};
