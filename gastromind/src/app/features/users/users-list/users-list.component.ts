import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsersService } from '../users.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { User } from '../../../core/models/users.models';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css',
})
export class UsersListComponent implements OnInit {
  protected readonly svc    = inject(UsersService);
  private readonly router   = inject(Router);
  private readonly toast    = inject(ToastService);
  private readonly confirm  = inject(ConfirmDialogService);

  ngOnInit(): void {
    this.svc.loadAll();
  }

  goToDetail(id: string): void {
    this.router.navigate(['/users', id]);
  }

  async onDelete(event: Event, user: User): Promise<void> {
    event.stopPropagation();

    const confirmed = await this.confirm.confirm({
      title: `¿Eliminar usuario?`,
      message: `Vas a eliminar a ${user.name}. ¿Deseas continuar?`,
      entityName: user.email,
    });

    if (!confirmed) return;

    this.svc.delete(user.id).subscribe({
      next: () => {
        this.toast.success(`Usuario "${user.name}" eliminado correctamente.`);
        this.svc.loadAll();
      },
      error: () => {
        this.toast.error(`No se pudo eliminar a "${user.name}". Inténtalo de nuevo.`);
      },
    });
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  }

  formatRole(role: string): string {
    return role.replace('ROLE_', '').charAt(0) + role.replace('ROLE_', '').slice(1).toLowerCase();
  }

  roleBadgeClass(role: string): string {
    if (role === 'ROLE_ADMIN')  return 'badge badge--green';
    if (role === 'ROLE_OWNER')  return 'badge badge--orange';
    return 'badge badge--default';
  }

  shortId(id: string): string {
    return id.slice(0, 8) + '…';
  }
}
