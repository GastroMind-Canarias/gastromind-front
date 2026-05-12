import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from '../users.service';
import { HouseholdsService } from '../../households/households.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { User, CreateUserPayload } from '../../../core/models/users.models';

export type SortDir = 'asc' | 'desc';

const ALL_ROLES = [
  { value: 'ROLE_ADMIN',          label: 'Admin' },
  { value: 'ROLE_OWNER',          label: 'Owner' },
  { value: 'ROLE_MEMBER',         label: 'Member' },
  { value: 'ROLE_PREMIUM_MEMBER', label: 'Premium Member' },
  { value: 'ROLE_TESTS',          label: 'Tests' },
];

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css',
})
export class UsersListComponent implements OnInit {
  protected readonly svc      = inject(UsersService);
  protected readonly houseSvc = inject(HouseholdsService);
  private readonly router     = inject(Router);
  private readonly toast      = inject(ToastService);
  private readonly confirm    = inject(ConfirmDialogService);

  readonly availableRoles = ALL_ROLES;

  readonly searchQuery = signal('');
  readonly sortDir     = signal<SortDir>('asc');

  readonly displayUsers = computed(() => {
    const q   = this.searchQuery().trim().toLowerCase();
    const dir = this.sortDir();
    const households = this.houseSvc.households();

    let list = this.svc.users().map(u => ({
      user: u,
      householdName: households.find(h => h.id === u.houseHold_id)?.name
        ?? (u.houseHold_id ? u.houseHold_id.slice(0, 8) + '…' : '—'),
    }));

    if (q) {
      list = list.filter(r =>
        r.user.name.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const diff = a.user.name.localeCompare(b.user.name);
      return dir === 'asc' ? diff : -diff;
    });

    return list;
  });

  readonly showModal = signal(false);
  readonly isSaving  = signal(false);

  formName     = '';
  formEmail    = '';
  formPassword = '';
  formRole     = 'ROLE_MEMBER';

  ngOnInit(): void {
    this.svc.loadAll();
    this.houseSvc.loadAll();
  }

  goToDetail(id: string): void { this.router.navigate(['/users', id]); }
  toggleSort(): void { this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc'); }
  openCreate(): void { this.formName = ''; this.formEmail = ''; this.formPassword = ''; this.formRole = 'ROLE_MEMBER'; this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); }

  onSave(): void {
    if (!this.formName.trim() || !this.formEmail.trim() || !this.formPassword.trim()) return;
    this.isSaving.set(true);
    const payload: CreateUserPayload = { name: this.formName.trim(), email: this.formEmail.trim(), password: this.formPassword, role: this.formRole };
    this.svc.create(payload).subscribe({
      next:  () => { this.toast.success('Usuario creado correctamente.'); this.svc.loadAll(); this.closeModal(); this.isSaving.set(false); },
      error: () => { this.toast.error('No se pudo crear el usuario.'); this.isSaving.set(false); },
    });
  }

  async onDelete(event: Event, user: User): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({ title: '¿Eliminar usuario?', message: `Vas a eliminar a ${user.name}. ¿Deseas continuar?`, entityName: user.email });
    if (!confirmed) return;
    this.svc.delete(user.id).subscribe({
      next:  () => { this.toast.success(`Usuario "${user.name}" eliminado.`); this.svc.loadAll(); },
      error: () => { this.toast.error(`No se pudo eliminar a "${user.name}".`); },
    });
  }

  initials(name: string): string { return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join(''); }
  formatRole(role: string): string { return ALL_ROLES.find(r => r.value === role)?.label ?? role.replace('ROLE_', ''); }
  roleBadgeClass(role: string): string {
    if (role === 'ROLE_ADMIN') return 'badge badge--green';
    if (role === 'ROLE_OWNER') return 'badge badge--orange';
    return 'badge badge--default';
  }
}
