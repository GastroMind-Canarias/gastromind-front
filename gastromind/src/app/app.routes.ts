import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Zona pública
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },

  // Zona privada — protegida por authGuard
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/layout.component').then(
        (m) => m.LayoutComponent
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes'),
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes'),
      },
      {
        path: 'households',
        loadChildren: () => import('./features/households/households.routes'),
      },
      {
        path: 'fridges',
        loadChildren: () => import('./features/fridges/fridges.routes'),
      },
      {
        path: 'tickets',
        loadChildren: () => import('./features/tickets/tickets.routes'),
      },
      {
        path: 'user-favorites',
        loadChildren: () => import('./features/user-favorites/user-favorites.routes'),
      },
      {
        path: 'units',
        loadChildren: () => import('./features/units/units.routes'),
      },
      {
        path: 'usual-purchases',
        loadChildren: () => import('./features/usual-purchases/usual-purchases.routes'),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'dashboard' },
];
