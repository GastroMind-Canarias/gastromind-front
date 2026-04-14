import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Component, HostListener, computed, inject } from '@angular/core';
import { ModalService } from './modal.service';

/**
 * Host visual único del sistema de modales.
 * - Se monta UNA vez (típicamente en AppComponent o LayoutComponent).
 * - Observa `ModalService.current()` (signal) y se renderiza condicionalmente.
 * - Soporta dos modos:
 *     1. Componente proyectado vía `NgComponentOutlet` (dinámico).
 *     2. `<ng-content>` para usos estáticos simples.
 *
 * Estética inspirada en el mockup "Token generado":
 * card blanca flotante, bordes XL, overlay verde muy suave y blur.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  private svc = inject(ModalService);

  /** Exponemos el signal para el template. */
  readonly config = this.svc.current;

  /** Clases responsivas según size, derivadas sin lógica en template. */
  readonly cardClass = computed(() => {
    const size = this.config()?.size ?? 'md';
    return { modal__card: true, [`modal__card--${size}`]: true };
  });

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.config()?.dismissible) this.svc.close();
  }

  onOverlayClick() {
    if (this.config()?.dismissible) this.svc.close();
  }

  close(result?: unknown) { this.svc.close(result); }
}
