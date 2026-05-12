import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FridgesService } from '../fridges.service';
import { HouseholdsService } from '../../households/households.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Fridge } from '../../../core/models/fridges.models';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-fridges-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fridges-list.component.html',
  styleUrl: './fridges-list.component.css',
})
export class FridgesListComponent implements OnInit {
  protected readonly svc       = inject(FridgesService);
  protected readonly houseSvc  = inject(HouseholdsService);
  private readonly router      = inject(Router);
  private readonly toast       = inject(ToastService);
  private readonly confirm     = inject(ConfirmDialogService);

  /* ── Search / filter ── */
  readonly searchQuery      = signal('');
  readonly filterHouseholdId = signal('');

  readonly displayFridges = computed(() => {
    const query     = this.searchQuery().trim().toLowerCase();
    const filterHid = this.filterHouseholdId();
    const households = this.houseSvc.households();

    return this.svc.fridges().filter(f => {
      const houseName = households.find(h => h.id === f.household_id)?.name ?? '';

      if (filterHid && f.household_id !== filterHid) return false;
      if (query && !houseName.toLowerCase().includes(query) && !f.id.toLowerCase().includes(query)) return false;
      return true;
    });
  });

  /* ── Modal state ── */
  readonly showModal   = signal(false);
  readonly modalMode   = signal<ModalMode>('create');
  readonly editingId   = signal<string | null>(null);
  readonly isSaving    = signal(false);

  /* ── Form fields ── */
  formHouseholdId = '';

  readonly householdOptions = computed(() => this.houseSvc.households());

  ngOnInit(): void {
    this.svc.loadAll();
    this.houseSvc.loadAll();
  }

  goToDetail(id: string): void {
    this.router.navigate(['/fridges', id]);
  }

  shortId(id: string): string {
    return id.slice(0, 8) + '…';
  }

  householdName(id: string): string {
    return this.houseSvc.households().find(h => h.id === id)?.name ?? this.shortId(id);
  }

  /* ── Modal helpers ── */
  openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.formHouseholdId = this.houseSvc.households()[0]?.id ?? '';
    this.showModal.set(true);
  }

  openEdit(event: Event, fridge: Fridge): void {
    event.stopPropagation();
    this.modalMode.set('edit');
    this.editingId.set(fridge.id);
    this.formHouseholdId = fridge.household_id;
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSave(): void {
    if (!this.formHouseholdId) return;
    this.isSaving.set(true);

    const payload = { household_id: this.formHouseholdId };

    if (this.modalMode() === 'create') {
      this.svc.create(payload).subscribe({
        next: () => {
          this.toast.success('Nevera creada correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('No se pudo crear la nevera.');
          this.isSaving.set(false);
        },
      });
    } else {
      const id = this.editingId()!;
      this.svc.update(id, payload).subscribe({
        next: () => {
          this.toast.success('Nevera actualizada correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('No se pudo actualizar la nevera.');
          this.isSaving.set(false);
        },
      });
    }
  }

  async onDelete(event: Event, fridge: Fridge): Promise<void> {
    event.stopPropagation();

    const confirmed = await this.confirm.confirm({
      title: '¿Eliminar nevera?',
      message: `Vas a eliminar la nevera ${this.shortId(fridge.id)} y todos sus items. ¿Deseas continuar?`,
      entityName: fridge.id,
    });

    if (!confirmed) return;

    this.svc.delete(fridge.id).subscribe({
      next: () => {
        this.toast.success('Nevera eliminada correctamente.');
        this.svc.loadAll();
      },
      error: () => {
        this.toast.error('No se pudo eliminar la nevera. Inténtalo de nuevo.');
      },
    });
  }
}
