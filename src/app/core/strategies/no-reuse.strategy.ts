import {
  RouteReuseStrategy,
  DetachedRouteHandle,
  ActivatedRouteSnapshot,
} from '@angular/router';

/**
 * NoReuseStrategy — nunca reutiliza componentes de página.
 *
 * Excepción: el shell de layout (marcado con `data: { reuse: true }`) se
 * conserva para que el sidebar, modal-outlet y toast no se destruyan en
 * cada navegación.
 */
export class NoReuseStrategy implements RouteReuseStrategy {
  /** Nunca almacenamos rutas desconectadas. */
  shouldDetach(_route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  store(_route: ActivatedRouteSnapshot, _handle: DetachedRouteHandle | null): void {
    // No almacenamos nada.
  }

  /** Nunca reenganchamos rutas almacenadas. */
  shouldAttach(_route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  retrieve(_route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  /**
   * Reutilizamos la ruta SOLO si tiene `data.reuse === true` (el shell de layout).
   * Todos los demás componentes se destruyen y re-crean en cada navegación,
   * garantizando que `ngOnInit()` siempre se ejecute y los datos se recarguen.
   */
  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot,
  ): boolean {
    return (
      future.routeConfig === curr.routeConfig &&
      !!future.routeConfig?.data?.['reuse']
    );
  }
}
