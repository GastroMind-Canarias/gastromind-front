import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./units-list/units-list.component').then(m => m.UnitsListComponent),
  },
];

export default routes;
