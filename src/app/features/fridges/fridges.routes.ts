import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./fridges-list/fridges-list.component').then(m => m.FridgesListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./fridge-detail/fridge-detail.component').then(m => m.FridgeDetailComponent),
  },
];

export default routes;
