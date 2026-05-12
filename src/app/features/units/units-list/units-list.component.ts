import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UnitsService } from '../units.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Unit } from '../../../core/models/units.models';

@Component({
  selector: 'app-units-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './units-list.component.html',
  styleUrl: './units-list.component.css',
})
export class UnitsListComponent implements OnInit {
  protected readonly svc  = inject(UnitsService);
  private readonly toast  = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  /* ── Search ── */
  readonly searchQuery = signal('');

  readonly displayUnits = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.svc.units();
    return this.svc.units().filter(u => u.name.toLowerCase().includes(q));
  });

  /* ── Modal ── */
  readonly showModal = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly isSaving  = signal(false);

  formName = '';

  ngOnInit(): void {
    this.svc.loadAll();
  }

  shortId(id: string): string {
    return id.slice(0, 8) + '…';
  }

  openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.formName = '';
    this.showModal.set(true);
  }

  openEdit(event: Event, unit: Unit): void {
    event.stopPropagation();
    this.modalMode.set('edit');
    this.editingId.set(unit.id);
    this.formName = unit.name;
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  onSave(): void {
    if (!this.formName.trim()) return;
    this.isSaving.set(true);
    const payload = { name: this.formName.trim() };

    if (this.modalMode() === 'create') {
      this.svc.create(payload).subscribe({
        next: () => {
          this.toast.success('Unidad creada correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo crear la unidad.'); this.isSaving.set(false); },
      });
    } else {
      this.svc.update(this.editingId()!, payload).subscribe({
        next: () => {
          this.toast.success('Unidad actualizada correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo actualizar la unidad.'); this.isSaving.set(false); },
      });
    }
  }

  async onDelete(event: Event, unit: Unit): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar unidad?',
      message:    `Vas a eliminar la unidad "${unit.name}". ¿Deseas continuar?`,
      entityName: unit.name,
    });
    if (!confirmed) return;

    this.svc.delete(unit.id).subscribe({
      next:  () => { this.toast.success('Unidad eliminada correctamente.'); this.svc.loadAll(); },
      error: () => { this.toast.error('No se pudo eliminar la unidad.'); },
    });
  }
}
