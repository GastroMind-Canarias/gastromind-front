import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ModalComponent } from '../../shared/components/modal';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../core/services/auth.service';
import { authToken, currentUser } from '../../core/store/auth.store';

/**
 * LayoutComponent — shell de la zona privada.
 * Responsabilidades:
 *  · Componer Sidebar + Topbar + <router-outlet>.
 *  · Hidratar el perfil del usuario si solo hay token en localStorage.
 *  · Exponer el avatar/dropdown con opción de logout.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ModalComponent, ToastComponent, ConfirmDialogComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);

  /** Referencia al sidebar para abrir el drawer desde el burger del topbar. */
  @ViewChild(SidebarComponent) private sidebar!: SidebarComponent;

  // ── Datos del usuario ──────────────────────────────────────────────────
  readonly user = currentUser;

  readonly userInitials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    // Hasta 2 iniciales: "Ana García" → "AG"
    return u.name
      .split(' ')
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('');
  });

  // ── Estado del dropdown de usuario ────────────────────────────────────
  readonly menuOpen = signal(false);

  // ── Acciones ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Si hubo un refresco de página: el token sigue en localStorage
    // pero el perfil no está en memoria → recuperarlo.
    if (authToken() && !currentUser()) {
      this.authService.loadCurrentUser().subscribe();
    }
  }

  openMobile(): void {
    this.sidebar?.openMobile();
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
