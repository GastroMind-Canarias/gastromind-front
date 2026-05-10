import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./usual-purchases-list/usual-purchases-list.component').then(
        m => m.UsualPurchasesListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./usual-purchase-detail/usual-purchase-detail.component').then(
        m => m.UsualPurchaseDetailComponent
      ),
  },
];

export default routes;
