import { Component, effect, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserFavoritesService } from '../user-favorites.service';
import { UsersService } from '../../users/users.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { UsualPurchase, CreateUsualPurchasePayload } from '../../../core/models/usual-purchases.models';
import { SortDir } from '../../../core/models/tickets.models';

@Component({
  selector: 'app-user-favorites-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-favorites-list.component.html',
  styleUrl: './user-favorites-list.component.css',
})
export class UserFavoritesListComponent implements OnInit {
  protected readonly svc      = inject(UserFavoritesService);
  protected readonly usersSvc = inject(UsersService);
  private readonly router     = inject(Router);
  private readonly toast      = inject(ToastService);
  private readonly confirm    = inject(ConfirmDialogService);

  /* ── Search / sort ── */
  readonly searchQuery = signal('');
  readonly sortDir     = signal<SortDir>('desc');

  /* ── Computed view ── */
  readonly displayPurchases = computed(() => {
    const query      = this.searchQuery().trim().toLowerCase();
    const users      = this.usersSvc.users();
    const productMap = this.svc.productMap();
    const dir        = this.sortDir();

    let result = this.svc.purchases().map(p => ({
      purchase:    p,
      userName:    users.find(u => u.id === p.user_id)?.name ?? p.user_id.slice(0, 8) + '…',
      productName: productMap[p.product_id] ?? p.product_id.slice(0, 8) + '…',
    }));

    if (query) {
      result = result.filter(r =>
        r.userName.toLowerCase().includes(query) ||
        r.productName.toLowerCase().includes(query) ||
        r.purchase.product_id.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const diff = a.purchase.target_quantity - b.purchase.target_quantity;
      return dir === 'asc' ? diff : -diff;
    });

    return result;
  });

  constructor() {
    effect(() => {
      if (this.svc.purchases().length) this.svc.loadProducts();
    });
  }

  /* ── Modal ── */
  readonly showModal = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly isSaving  = signal(false);

  /* ── Form ── */
  formUserId         = '';
  formProductId      = '';
  formTargetQuantity = 1;

  ngOnInit(): void {
    this.svc.loadAll();
    this.usersSvc.loadAll();
  }

  goToDetail(id: string): void {
    this.router.navigate(['/user-favorites', id]);
  }

  shortId(id: string): string {
    return id.slice(0, 8) + '…';
  }

  toggleSort(): void {
    this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  /* ── Modal ── */
  openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.formUserId         = '';
    this.formProductId      = '';
    this.formTargetQuantity = 1;
    this.showModal.set(true);
  }

  openEdit(event: Event, p: UsualPurchase): void {
    event.stopPropagation();
    this.modalMode.set('edit');
    this.editingId.set(p.id);
    this.formUserId         = p.user_id;
    this.formProductId      = p.product_id;
    this.formTargetQuantity = p.target_quantity;
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  buildPayload(): CreateUsualPurchasePayload {
    return {
      user_id:         this.formUserId,
      product_id:      this.formProductId,
      target_quantity: this.formTargetQuantity,
    };
  }

  onSave(): void {
    if (!this.formUserId || !this.formProductId || this.formTargetQuantity <= 0) return;
    this.isSaving.set(true);

    const payload = this.buildPayload();

    if (this.modalMode() === 'create') {
      this.svc.create(payload).subscribe({
        next: () => {
          this.toast.success('Compra habitual creada correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo crear la compra habitual.'); this.isSaving.set(false); },
      });
    } else {
      this.svc.update(this.editingId()!, payload).subscribe({
        next: () => {
          this.toast.success('Compra habitual actualizada correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo actualizar la compra habitual.'); this.isSaving.set(false); },
      });
    }
  }

  async onDelete(event: Event, p: UsualPurchase): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar compra habitual?',
      message:    `Vas a eliminar la compra habitual con cantidad objetivo ${p.target_quantity}. ¿Deseas continuar?`,
      entityName: p.id,
    });
    if (!confirmed) return;

    this.svc.delete(p.id).subscribe({
      next:  () => { this.toast.success('Compra habitual eliminada correctamente.'); this.svc.loadAll(); },
      error: () => { this.toast.error('No se pudo eliminar la compra habitual.'); },
    });
  }
}
