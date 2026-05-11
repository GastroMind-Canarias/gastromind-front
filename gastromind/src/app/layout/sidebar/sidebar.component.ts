import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
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

  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);

  readonly navItems = signal<NavItem[]>([
    { label: 'Dashboard',        route: '/dashboard',        icon: 'dashboard' },
    { label: 'Users',            route: '/users',            icon: 'users'     },
    { label: 'Households',       route: '/households',       icon: 'home'      },
    { label: 'Fridges',          route: '/fridges',          icon: 'fridge'    },
    { label: 'Tickets',          route: '/tickets',          icon: 'ticket'    },
    { label: 'Units',            route: '/units',            icon: 'units'     },
    { label: 'Usual Purchases',  route: '/usual-purchases',  icon: 'shopping'  },
  ]);

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
