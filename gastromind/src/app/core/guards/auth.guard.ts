import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { authToken } from '../store/auth.store';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (authToken()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
