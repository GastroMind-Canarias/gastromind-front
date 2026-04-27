import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../users.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';

export type UserRole = 'ROLE_ADMIN' | 'ROLE_OWNER' | 'ROLE_MEMBER' | 'ROLE_PREMIUM_MEMBER' | 'ROLE_TESTS';

export const AVAILABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: 'ROLE_ADMIN',          label: 'Admin' },
  { value: 'ROLE_OWNER',         label: 'Owner' },
  { value: 'ROLE_MEMBER',        label: 'Member' },
  { value: 'ROLE_PREMIUM_MEMBER', label: 'Premium Member' },
  { value: 'ROLE_TESTS',         label: 'Tests' },
];

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css',
})
export class UserDetailComponent implements OnInit {
  protected readonly svc      = inject(UsersService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly toast      = inject(ToastService);
  private readonly confirm    = inject(ConfirmDialogService);

  readonly availableRoles = AVAILABLE_ROLES;
  readonly selectedRole   = signal<UserRole | ''>('');
  readonly isSavingRole   = signal(false);

  constructor() {
    effect(() => {
      const user = this.svc.selectedUser();
      if (user) this.selectedRole.set(user.role as UserRole);
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.loadById(id);
  }

  onUserLoaded(): void {
    const user = this.svc.selectedUser();
    if (user) this.selectedRole.set(user.role as UserRole);
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  formatRole(role: string): string {
    const found = AVAILABLE_ROLES.find(r => r.value === role);
    return found ? found.label : role.replace('ROLE_', '');
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  }

  roleChanged(): boolean {
    const user = this.svc.selectedUser();
    return !!user && this.selectedRole() !== '' && this.selectedRole() !== user.role;
  }

  onSaveRole(): void {
    const user = this.svc.selectedUser();
    const newRole = this.selectedRole();
    if (!user || !newRole || newRole === user.role) return;

    this.isSavingRole.set(true);
    this.svc.changeRole(user.id, newRole).subscribe({
      next: () => {
        this.svc.loadById(user.id);
        this.toast.success(`Rol de "${user.name}" actualizado a ${this.formatRole(newRole)}.`);
        this.isSavingRole.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cambiar el rol. Inténtalo de nuevo.');
        this.isSavingRole.set(false);
      },
    });
  }

  async onDelete(): Promise<void> {
    const user = this.svc.selectedUser();
    if (!user) return;

    const confirmed = await this.confirm.confirm({
      title: `¿Eliminar usuario?`,
      message: `Vas a eliminar a ${user.name}. ¿Deseas continuar?`,
      entityName: user.email,
    });

    if (!confirmed) return;

    this.svc.delete(user.id).subscribe({
      next: () => {
        this.toast.success(`Usuario "${user.name}" eliminado correctamente.`);
        this.router.navigate(['/users']);
      },
      error: () => {
        this.toast.error(`No se pudo eliminar a "${user.name}". Inténtalo de nuevo.`);
      },
    });
  }
}
