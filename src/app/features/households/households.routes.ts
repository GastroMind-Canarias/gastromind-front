import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./households-list/households-list.component').then(m => m.HouseholdsListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./household-detail/household-detail.component').then(m => m.HouseholdDetailComponent),
  },
];

export default routes;
