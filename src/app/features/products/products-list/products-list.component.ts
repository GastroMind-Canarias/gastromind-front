import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../products.service';
import { AllergensService } from '../../../core/services/allergens.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { Product } from '../../../core/models/products.models';
import type { SortDir } from '../../../core/models/tickets.models';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css',
})
export class ProductsListComponent implements OnInit {
  protected readonly svc        = inject(ProductsService);
  protected readonly allergenSvc = inject(AllergensService);
  private readonly toast        = inject(ToastService);
  private readonly confirm      = inject(ConfirmDialogService);

  /* ── Search / sort ── */
  readonly searchQuery = signal('');
  readonly sortDir     = signal<SortDir>('asc');

  readonly displayProducts = computed(() => {
    const q   = this.searchQuery().trim().toLowerCase();
    const dir = this.sortDir();

    let result = this.svc.products().map(p => ({
      product: p,
      allergenName: this.allergenSvc.nameById(p.allergen_id),
    }));

    if (q) {
      result = result.filter(r =>
        r.product.name.toLowerCase().includes(q) ||
        r.allergenName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const cmp = a.product.name.localeCompare(b.product.name, 'es');
      return dir === 'asc' ? cmp : -cmp;
    });

    return result;
  });

  /* ── Modal ── */
  readonly showModal = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly isSaving  = signal(false);

  /* ── Form ── */
  formName        = '';
  formIsEssential = false;
  formNeedsReview = false;
  formReviewNote  = '';
  formAllergenId  = '';

  ngOnInit(): void {
    this.svc.loadAll();
    this.allergenSvc.loadAll();
  }

  shortId(id: string): string { return id.slice(0, 8) + '…'; }

  toggleSort(): void { this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc'); }

  openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.formName        = '';
    this.formIsEssential = false;
    this.formNeedsReview = false;
    this.formReviewNote  = '';
    this.formAllergenId  = '';
    this.showModal.set(true);
  }

  openEdit(event: Event, product: Product): void {
    event.stopPropagation();
    this.modalMode.set('edit');
    this.editingId.set(product.id);
    this.formName        = product.name;
    this.formIsEssential = product.is_essential;
    this.formNeedsReview = product.needs_review;
    this.formReviewNote  = product.review_note ?? '';
    this.formAllergenId  = product.allergen_id ?? '';
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  buildPayload() {
    return {
      name:         this.formName.trim(),
      is_essential: this.formIsEssential,
      needs_review: this.formNeedsReview,
      review_note:  this.formReviewNote.trim() || null,
      allergen_id:  this.formAllergenId || null,
    };
  }

  onSave(): void {
    if (!this.formName.trim()) return;
    this.isSaving.set(true);
    const payload = this.buildPayload();

    if (this.modalMode() === 'create') {
      this.svc.create(payload).subscribe({
        next: () => {
          this.toast.success('Producto creado correctamente.');
          this.svc.loadAll(); this.closeModal(); this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo crear el producto.'); this.isSaving.set(false); },
      });
    } else {
      this.svc.update(this.editingId()!, payload).subscribe({
        next: () => {
          this.toast.success('Producto actualizado correctamente.');
          this.svc.loadAll(); this.closeModal(); this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo actualizar el producto.'); this.isSaving.set(false); },
      });
    }
  }

  async onDelete(event: Event, product: Product): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar producto?',
      message:    `Vas a eliminar "${product.name}". ¿Deseas continuar?`,
      entityName: product.name,
    });
    if (!confirmed) return;
    this.svc.delete(product.id).subscribe({
      next:  () => { this.toast.success('Producto eliminado correctamente.'); this.svc.loadAll(); },
      error: () => { this.toast.error('No se pudo eliminar el producto.'); },
    });
  }
}
