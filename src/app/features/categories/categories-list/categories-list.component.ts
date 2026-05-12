import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesService } from '../categories.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Category } from '../../../core/models/categories.models';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.css',
})
export class CategoriesListComponent implements OnInit {
  protected readonly svc   = inject(CategoriesService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  /* ── Search ── */
  readonly searchQuery = signal('');

  readonly displayCategories = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.svc.categories();
    return this.svc.categories().filter(c => c.name.toLowerCase().includes(q));
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

  openEdit(event: Event, cat: Category): void {
    event.stopPropagation();
    this.modalMode.set('edit');
    this.editingId.set(cat.id);
    this.formName = cat.name;
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
          this.toast.success('Categoría creada correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo crear la categoría.'); this.isSaving.set(false); },
      });
    } else {
      this.svc.update(this.editingId()!, payload).subscribe({
        next: () => {
          this.toast.success('Categoría actualizada correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo actualizar la categoría.'); this.isSaving.set(false); },
      });
    }
  }

  async onDelete(event: Event, cat: Category): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar categoría?',
      message:    `Vas a eliminar la categoría "${cat.name}". ¿Deseas continuar?`,
      entityName: cat.name,
    });
    if (!confirmed) return;

    this.svc.delete(cat.id).subscribe({
      next:  () => { this.toast.success('Categoría eliminada correctamente.'); this.svc.loadAll(); },
      error: () => { this.toast.error('No se pudo eliminar la categoría.'); },
    });
  }
}
