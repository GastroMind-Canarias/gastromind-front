import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tickets-list/tickets-list.component').then(m => m.TicketsListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent),
  },
];

export default routes;
