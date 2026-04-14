import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ModalComponent } from '../../shared/components/modal';
/**
 * LayoutComponent: shell de la zona privada.
 * Orquesta Sidebar + Topbar + contenido enrutado.
 * No contiene lógica de negocio: sólo composición.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ModalComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  /** Estado del usuario logueado (en producción vendría de AuthService / Signal store). */
  readonly user = signal({ name: 'davidAdmin', email: 'dricciodeabreu1@gmail.com', initial: 'D' });

  /** Controla el drawer en móvil desde el topbar. */
  readonly mobileNavOpen = signal(false);
  openMobile() { this.mobileNavOpen.set(true); }
  closeMobile() { this.mobileNavOpen.set(false); }
}
