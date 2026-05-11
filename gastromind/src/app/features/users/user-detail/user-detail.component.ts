import { Component, effect, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../users.service';
import { HouseholdsService } from '../../households/households.service';
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
  protected readonly houseSvc = inject(HouseholdsService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly toast      = inject(ToastService);
  private readonly confirm    = inject(ConfirmDialogService);

  readonly availableRoles = AVAILABLE_ROLES;
  readonly selectedRole   = signal<UserRole | ''>('');
  readonly isSavingRole   = signal(false);

  /* ── Household resolved ── */
  readonly resolvedHousehold = computed(() => {
    const u = this.svc.selectedUser();
    if (!u) return null;
    return this.houseSvc.households().find(h => h.id === u.houseHold_id) ?? null;
  });

  /* ── Edit modal ── */
  readonly showEditModal = signal(false);
  readonly isSavingEdit  = signal(false);
  formName  = '';
  formEmail = '';

  /* ── Allergen modal ── */
  readonly showAllergenModal = signal(false);
  readonly isSavingAllergen  = signal(false);
  formAllergenName = '';

  constructor() {
    effect(() => {
      const user = this.svc.selectedUser();
      if (user) this.selectedRole.set(user.role as UserRole);
    });
  }

  private get userId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.svc.loadById(this.userId);
    this.houseSvc.loadAll();
  }

  goBack(): void { this.router.navigate(['/users']); }

  formatRole(role: string): string {
    return AVAILABLE_ROLES.find(r => r.value === role)?.label ?? role.replace('ROLE_', '');
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
      next: () => { this.svc.loadById(user.id); this.toast.success(`Rol actualizado a ${this.formatRole(newRole)}.`); this.isSavingRole.set(false); },
      error: () => { this.toast.error('No se pudo cambiar el rol.'); this.isSavingRole.set(false); },
    });
  }

  /* ── Edit user ── */
  openEdit(): void {
    const u = this.svc.selectedUser()!;
    this.formName  = u.name;
    this.formEmail = u.email;
    this.showEditModal.set(true);
  }

  closeEdit(): void { this.showEditModal.set(false); }

  onSaveEdit(): void {
    if (!this.formName.trim() || !this.formEmail.trim()) return;
    this.isSavingEdit.set(true);
    this.svc.update(this.userId, { name: this.formName.trim(), email: this.formEmail.trim() }).subscribe({
      next: () => { this.toast.success('Usuario actualizado.'); this.svc.loadById(this.userId); this.closeEdit(); this.isSavingEdit.set(false); },
      error: () => { this.toast.error('No se pudo actualizar el usuario.'); this.isSavingEdit.set(false); },
    });
  }

  /* ── Allergens ── */
  openAddAllergen(): void { this.formAllergenName = ''; this.showAllergenModal.set(true); }
  closeAllergenModal(): void { this.showAllergenModal.set(false); }

  onSaveAllergen(): void {
    if (!this.formAllergenName.trim()) return;
    this.isSavingAllergen.set(true);
    this.svc.addAllergen(this.userId, this.formAllergenName.trim()).subscribe({
      next: () => { this.toast.success('Alérgeno añadido.'); this.svc.loadById(this.userId); this.closeAllergenModal(); this.isSavingAllergen.set(false); },
      error: () => { this.toast.error('No se pudo añadir el alérgeno.'); this.isSavingAllergen.set(false); },
    });
  }

  async onRemoveAllergen(allergenId: string, allergenName: string): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar alérgeno?',
      message:    `Vas a eliminar "${allergenName}" de este usuario.`,
      entityName: allergenName,
    });
    if (!confirmed) return;
    this.svc.removeAllergen(allergenId).subscribe({
      next:  () => { this.toast.success('Alérgeno eliminado.'); this.svc.loadById(this.userId); },
      error: () => { this.toast.error('No se pudo eliminar el alérgeno.'); },
    });
  }

  /* ── Delete user ── */
  async onDelete(): Promise<void> {
    const user = this.svc.selectedUser();
    if (!user) return;
    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar usuario?',
      message:    `Vas a eliminar a ${user.name}. ¿Deseas continuar?`,
      entityName: user.email,
    });
    if (!confirmed) return;
    this.svc.delete(user.id).subscribe({
      next:  () => { this.toast.success(`Usuario "${user.name}" eliminado.`); this.router.navigate(['/users']); },
      error: () => { this.toast.error(`No se pudo eliminar a "${user.name}".`); },
    });
  }
}
