import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HouseholdsService } from '../households.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Household, APPLIANCE_LABELS, Appliance } from '../../../core/models/households.models';

@Component({
  selector: 'app-households-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './households-list.component.html',
  styleUrl: './households-list.component.css',
})
export class HouseholdsListComponent implements OnInit {
  protected readonly svc    = inject(HouseholdsService);
  private readonly router   = inject(Router);
  private readonly toast    = inject(ToastService);
  private readonly confirm  = inject(ConfirmDialogService);

  /* ── Search & sort ── */
  readonly searchQuery = signal('');
  readonly sortDir     = signal<'asc' | 'desc'>('asc');

  readonly displayHouseholds = computed(() => {
    const q   = this.searchQuery().toLowerCase().trim();
    const dir = this.sortDir();
    let list  = this.svc.households();

    if (q) {
      list = list.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.members.some(m => m.name.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  toggleSort(): void {
    this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  /* ── Create modal ── */
  readonly showModal = signal(false);
  readonly isSaving  = signal(false);
  formName = '';

  openCreate(): void { this.formName = ''; this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); }

  onSave(): void {
    if (!this.formName.trim()) return;
    this.isSaving.set(true);
    this.svc.create({ name: this.formName.trim() }).subscribe({
      next: () => {
        this.toast.success(`Hogar "${this.formName.trim()}" creado correctamente.`);
        this.svc.loadAll();
        this.closeModal();
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('No se pudo crear el hogar.');
        this.isSaving.set(false);
      },
    });
  }

  /* ── Lifecycle ── */
  ngOnInit(): void {
    this.svc.loadAll();
  }

  goToDetail(id: string): void {
    this.router.navigate(['/households', id]);
  }

  applianceLabel(key: string): string {
    return APPLIANCE_LABELS[key as Appliance] ?? key;
  }

  async onDelete(event: Event, h: Household): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar hogar?',
      message:    `Vas a eliminar "${h.name}" y todos sus datos. ¿Deseas continuar?`,
      entityName: h.name,
    });
    if (!confirmed) return;
    this.svc.delete(h.id).subscribe({
      next:  () => { this.toast.success(`Hogar "${h.name}" eliminado correctamente.`); this.svc.loadAll(); },
      error: () => { this.toast.error(`No se pudo eliminar "${h.name}". Inténtalo de nuevo.`); },
    });
  }
}
