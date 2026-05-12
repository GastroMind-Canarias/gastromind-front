import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./products-list/products-list.component').then(
        m => m.ProductsListComponent
      ),
  },
];

export default routes;
