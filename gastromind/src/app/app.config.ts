import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, RouteReuseStrategy, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { NoReuseStrategy } from './core/strategies/no-reuse.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // onSameUrlNavigation: 'reload' → el router procesa la navegación incluso
    // si la URL no cambia (e.g. clic en el link del sidebar de la página actual).
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),

    provideHttpClient(withInterceptors([authInterceptor])),

    // NoReuseStrategy → los componentes de página se destruyen y re-crean en
    // cada navegación (ngOnInit() siempre se ejecuta → datos siempre frescos).
    // El shell de layout queda excluido mediante data: { reuse: true }.
    { provide: RouteReuseStrategy, useClass: NoReuseStrategy },
  ],
};
