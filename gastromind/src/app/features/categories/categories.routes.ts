import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./categories-list/categories-list.component').then(
        m => m.CategoriesListComponent
      ),
  },
];

export default routes;
