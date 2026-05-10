import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsualPurchasesService } from '../usual-purchases.service';
import { UsersService } from '../../users/users.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { UsualPurchase, CreateUsualPurchasePayload } from '../../../core/models/usual-purchases.models';
import { SortDir } from '../../../core/models/tickets.models';

@Component({
  selector: 'app-usual-purchases-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usual-purchases-list.component.html',
  styleUrl: './usual-purchases-list.component.css',
})
export class UsualPurchasesListComponent implements OnInit {
  protected readonly svc      = inject(UsualPurchasesService);
  protected readonly usersSvc = inject(UsersService);
  private readonly router     = inject(Router);
  private readonly toast      = inject(ToastService);
  private readonly confirm    = inject(ConfirmDialogService);

  /* ── Search / sort ── */
  readonly searchQuery = signal('');
  readonly sortDir     = signal<SortDir>('desc');

  readonly displayPurchases = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const users = this.usersSvc.users();
    const dir   = this.sortDir();

    let result = this.svc.purchases().map(p => ({
      purchase: p,
      userName: users.find(u => u.id === p.user_id)?.name ?? p.user_id.slice(0, 8) + '…',
    }));

    if (query) {
      result = result.filter(r =>
        r.userName.toLowerCase().includes(query) ||
        r.purchase.product_id.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const diff = a.purchase.target_quantity - b.purchase.target_quantity;
      return dir === 'asc' ? diff : -diff;
    });

    return result;
  });

  /* ── Modal ── */
  readonly showModal = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingId = signal<string | null>(null);
  readonly isSaving  = signal(false);

  formUserId         = '';
  formProductId      = '';
  formTargetQuantity = 1;

  ngOnInit(): void {
    this.svc.loadAll();
    this.usersSvc.loadAll();
  }

  goToDetail(id: string): void {
    this.router.navigate(['/usual-purchases', id]);
  }

  shortId(id: string): string {
    return id.slice(0, 8) + '…';
  }

  toggleSort(): void {
    this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
  }

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

  private buildPayload(): CreateUsualPurchasePayload {
    return {
      user_id:         this.formUserId.trim(),
      product_id:      this.formProductId.trim(),
      target_quantity: this.formTargetQuantity,
    };
  }

  onSave(): void {
    if (!this.formUserId.trim() || !this.formProductId.trim()) return;
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
      message:    `Vas a eliminar la compra habitual del producto "${p.product_id}". ¿Deseas continuar?`,
      entityName: p.id,
    });
    if (!confirmed) return;

    this.svc.delete(p.id).subscribe({
      next:  () => { this.toast.success('Compra habitual eliminada correctamente.'); this.svc.loadAll(); },
      error: () => { this.toast.error('No se pudo eliminar la compra habitual.'); },
    });
  }
}
