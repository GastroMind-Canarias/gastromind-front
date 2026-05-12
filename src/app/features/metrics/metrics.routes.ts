import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./metrics-dashboard/metrics-dashboard.component').then(
        m => m.MetricsDashboardComponent
      ),
  },
];

export default routes;
