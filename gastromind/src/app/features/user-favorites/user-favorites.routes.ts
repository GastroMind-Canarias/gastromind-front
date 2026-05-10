import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./user-favorites-list/user-favorites-list.component').then(
        m => m.UserFavoritesListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./user-favorite-detail/user-favorite-detail.component').then(
        m => m.UserFavoriteDetailComponent
      ),
  },
];

export default routes;
