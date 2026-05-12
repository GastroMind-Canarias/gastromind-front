import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { authToken } from '../store/auth.store';

/**
 * authGuard — protege rutas privadas.
 * Si no hay token redirige a /login.
 * Aplicado en canActivate (primera carga del shell) y
 * canActivateChild (cada navegación entre páginas hijas).
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (authToken()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

/**
 * noAuthGuard — protege la página de login.
 * Si el usuario ya tiene sesión lo redirige al dashboard
 * para que no vea la pantalla de login innecesariamente.
 */
export const noAuthGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (!authToken()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
