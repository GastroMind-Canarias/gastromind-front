import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HouseholdsService } from '../households.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Household, APPLIANCE_LABELS, Appliance } from '../../../core/models/households.models';

@Component({
  selector: 'app-households-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './households-list.component.html',
  styleUrl: './households-list.component.css',
})
export class HouseholdsListComponent implements OnInit {
  protected readonly svc    = inject(HouseholdsService);
  private readonly router   = inject(Router);
  private readonly toast    = inject(ToastService);
  private readonly confirm  = inject(ConfirmDialogService);

  ngOnInit(): void {
    this.svc.loadAll();
  }

  goToDetail(id: string): void {
    this.router.navigate(['/households', id]);
  }

  memberNames(h: Household): string {
    if (!h.members.length) return '—';
    return h.members.map(m => m.name).join(', ');
  }

  applianceLabel(key: string): string {
    return APPLIANCE_LABELS[key as Appliance] ?? key;
  }

  async onDelete(event: Event, h: Household): Promise<void> {
    event.stopPropagation();

    const confirmed = await this.confirm.confirm({
      title: '¿Eliminar hogar?',
      message: `Vas a eliminar "${h.name}" y todos sus datos. ¿Deseas continuar?`,
      entityName: h.id,
    });

    if (!confirmed) return;

    this.svc.delete(h.id).subscribe({
      next: () => {
        this.toast.success(`Hogar "${h.name}" eliminado correctamente.`);
        this.svc.loadAll();
      },
      error: () => {
        this.toast.error(`No se pudo eliminar "${h.name}". Inténtalo de nuevo.`);
      },
    });
  }
}
