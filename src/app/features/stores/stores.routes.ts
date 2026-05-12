import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./stores-list/stores-list.component').then(
        m => m.StoresListComponent
      ),
  },
];

export default routes;
