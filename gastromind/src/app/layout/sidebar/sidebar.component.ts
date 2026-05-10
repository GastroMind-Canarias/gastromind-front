import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Definición de ítem de navegación.
 * Centralizado en el componente para que añadir una ruta sea cambiar
 * una única fuente de verdad (`NAV_ITEMS`).
 */
interface NavItem {
  label: string;
  route: string;
  icon: string; // nombre del path SVG inline (evitamos dependencias de iconos)
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private authService = inject(AuthService);

  /**
   * Signals (Angular 17/18): estado reactivo sin RxJS para UI local.
   * `collapsed` permite colapsar la sidebar en escritorio.
   * `mobileOpen` controla el drawer en viewport pequeño.
   */
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);

  readonly navItems = signal<NavItem[]>([
    { label: 'Dashboard',  route: '/dashboard',  icon: 'dashboard' },
    { label: 'Users',      route: '/users',      icon: 'users'     },
    { label: 'Households', route: '/households', icon: 'home'      },
    { label: 'Fridges',    route: '/fridges',    icon: 'fridge'    },
    { label: 'Tickets',          route: '/tickets',          icon: 'ticket'    },
    { label: 'Usual Purchases',  route: '/usual-purchases',  icon: 'shopping'  },
  ]);

  /** Clase derivada: evita lógica en template. */
  readonly asideClass = computed(() => ({
    'sidebar': true,
    'sidebar--collapsed': this.collapsed(),
    'sidebar--open': this.mobileOpen(),
  }));

  toggleCollapse() { this.collapsed.update(v => !v); }
  closeMobile()    { this.mobileOpen.set(false); }
  openMobile()     { this.mobileOpen.set(true); }

  logout(): void {
    this.authService.logout();
  }
}
