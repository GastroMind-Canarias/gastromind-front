import { Injectable, signal, Type } from '@angular/core';

/**
 * Configuración de un modal abierto.
 * `component` permite proyectar cualquier contenido dinámico
 * (patrón "modal-as-a-host"), manteniendo el shell visual consistente.
 */
export interface ModalConfig<TData = unknown, TResult = unknown> {
  title?: string;
  subtitle?: string;
  component?: Type<unknown>;           // contenido proyectado opcional
  data?: TData;                         // datos pasados al componente hijo
  size?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;                // cerrar clicando overlay / ESC
  // Resuelve cuando el modal se cierra
  resolve?: (result?: TResult) => void;
}

/**
 * Servicio global (providedIn: 'root') — una sola instancia.
 * Expone un `signal` con el estado del modal activo para que el componente
 * `<app-modal>` (montado una vez en el shell) lo consuma reactivamente.
 * Usamos signals en lugar de BehaviorSubject para alinearnos con Angular 17+.
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly current = signal<ModalConfig | null>(null);

  open<TData = unknown, TResult = unknown>(
    config: Omit<ModalConfig<TData, TResult>, 'resolve'>
  ): Promise<TResult | undefined> {
    return new Promise(resolve => {
      this.current.set({
        size: 'md',
        dismissible: true,
        ...config,
        resolve: resolve as (r?: unknown) => void,
      } as ModalConfig);
    });
  }

  close(result?: unknown) {
    const cfg = this.current();
    cfg?.resolve?.(result);
    this.current.set(null);
  }
}
