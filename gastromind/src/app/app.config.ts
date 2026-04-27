import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // withInterceptors acepta interceptores funcionales (Angular 15+).
    // authInterceptor añade ?JWT=<token> a todas las peticiones autenticadas.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
