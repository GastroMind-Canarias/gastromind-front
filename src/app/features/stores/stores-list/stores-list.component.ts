import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoresService } from '../stores.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Store } from '../../../core/models/stores.models';

@Component({
  selector: 'app-stores-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stores-list.component.html',
  styleUrl: './stores-list.component.css',
})
export class StoresListComponent implements OnInit {
  protected readonly svc   = inject(StoresService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly searchQuery = signal('');

  readonly displayStores = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.svc.stores();
    return this.svc.stores().filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.name_norm.toLowerCase().includes(q)
    );
  });

  /* ── Modal ── */
  readonly showModal = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly isSaving  = signal(false);

  formName = '';

  ngOnInit(): void { this.svc.loadAll(); }

  shortId(id: string): string { return id.slice(0, 8) + '…'; }

  openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.formName = '';
    this.showModal.set(true);
  }

  openEdit(event: Event, store: Store): void {
    event.stopPropagation();
    this.modalMode.set('edit');
    this.editingId.set(store.id);
    this.formName = store.name;
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
          this.toast.success('Tienda creada correctamente.');
          this.svc.loadAll(); this.closeModal(); this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo crear la tienda.'); this.isSaving.set(false); },
      });
    } else {
      this.svc.update(this.editingId()!, payload).subscribe({
        next: () => {
          this.toast.success('Tienda actualizada correctamente.');
          this.svc.loadAll(); this.closeModal(); this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo actualizar la tienda.'); this.isSaving.set(false); },
      });
    }
  }

  async onDelete(event: Event, store: Store): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar tienda?',
      message:    `Vas a eliminar "${store.name}". ¿Deseas continuar?`,
      entityName: store.name,
    });
    if (!confirmed) return;
    this.svc.delete(store.id).subscribe({
      next:  () => { this.toast.success('Tienda eliminada correctamente.'); this.svc.loadAll(); },
      error: () => { this.toast.error('No se pudo eliminar la tienda.'); },
    });
  }
}
