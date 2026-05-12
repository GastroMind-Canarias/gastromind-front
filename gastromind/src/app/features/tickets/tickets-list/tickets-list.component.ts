import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketsService } from '../tickets.service';
import { UsersService } from '../../users/users.service';
import { StoresService } from '../../stores/stores.service';
import { ProductsService } from '../../products/products.service';
import { UnitsService } from '../../units/units.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import {
  Ticket,
  CreateTicketPayload,
  CreateTicketItemPayload,
  VerificationStatus,
  SortDir,
} from '../../../core/models/tickets.models';

const BLANK_ITEM = (): CreateTicketItemPayload => ({
  product_id:          '',
  line_product_name:   '',
  quantity:            1,
  price_unit:          0,
  unit_id:             '',
  verification_status: 'OK',
  line_note:           null,
});

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.css',
})
export class TicketsListComponent implements OnInit {
  protected readonly svc         = inject(TicketsService);
  protected readonly usersSvc    = inject(UsersService);
  protected readonly storesSvc   = inject(StoresService);
  protected readonly productsSvc = inject(ProductsService);
  protected readonly unitsSvc    = inject(UnitsService);
  private readonly router        = inject(Router);
  private readonly toast         = inject(ToastService);
  private readonly confirm       = inject(ConfirmDialogService);

  /* ── Search / sort ── */
  readonly searchQuery  = signal('');
  readonly sortDir      = signal<SortDir>('desc');

  /* ── Computed view ── */
  readonly displayTickets = computed(() => {
    const query    = this.searchQuery().trim().toLowerCase();
    const users    = this.usersSvc.users();
    const dir      = this.sortDir();

    let result = this.svc.tickets().map(t => ({
      ticket:   t,
      userName: users.find(u => u.id === t.user_id)?.name ?? t.user_id.slice(0, 8) + '…',
    }));

    if (query) {
      result = result.filter(r => r.userName.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      const diff = a.ticket.items.length - b.ticket.items.length;
      return dir === 'asc' ? diff : -diff;
    });

    return result;
  });

  /* ── Modal ── */
  readonly showModal  = signal(false);
  readonly modalMode  = signal<'create' | 'edit'>('create');
  readonly editingId  = signal<string | null>(null);
  readonly isSaving   = signal(false);

  /* ── Form main fields ── */
  formUserId      = '';
  formStoreId     = '';
  formTotalMount  = 0;
  formPurchaseDate = '';

  /* ── Form items (dynamic) ── */
  formItems: CreateTicketItemPayload[] = [BLANK_ITEM()];

  ngOnInit(): void {
    this.svc.loadAll();
    this.usersSvc.loadAll();
    this.storesSvc.loadAll();
    this.productsSvc.loadAll();
    this.unitsSvc.loadAll();
  }

  /** Al seleccionar un producto en un item, auto-rellena el nombre de línea */
  onProductSelected(item: CreateTicketItemPayload, productId: string): void {
    item.product_id = productId;
    const product = this.productsSvc.products().find(p => p.id === productId);
    if (product) { item.line_product_name = product.name; }
  }

  goToDetail(id: string): void {
    this.router.navigate(['/tickets', id]);
  }

  shortId(id: string): string {
    return id.slice(0, 8) + '…';
  }

  toggleSort(): void {
    this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  /* ── Item helpers ── */
  addItem(): void {
    this.formItems = [...this.formItems, BLANK_ITEM()];
  }

  removeItem(i: number): void {
    if (this.formItems.length === 1) return;
    this.formItems = this.formItems.filter((_, idx) => idx !== i);
  }

  trackByIdx(i: number): number { return i; }

  /* ── Modal ── */
  openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.formUserId      = '';
    this.formStoreId     = '';
    this.formTotalMount  = 0;
    this.formPurchaseDate = new Date().toISOString().slice(0, 10);
    this.formItems       = [BLANK_ITEM()];
    this.showModal.set(true);
  }

  openEdit(event: Event, t: Ticket): void {
    event.stopPropagation();
    this.modalMode.set('edit');
    this.editingId.set(t.id);
    this.formUserId       = t.user_id;
    this.formStoreId      = t.store_id;
    this.formTotalMount   = t.total_amount;
    this.formPurchaseDate = t.purchaseDate;
    this.formItems = t.items.map(i => ({
      product_id:          i.product_id,
      line_product_name:   i.product_name,
      quantity:            i.quantity,
      price_unit:          i.price_unit,
      unit_id:             i.unit_id,
      verification_status: i.verification_status as VerificationStatus,
      line_note:           i.line_note,
    }));
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  buildPayload(): CreateTicketPayload {
    return {
      user_id:      this.formUserId,
      store_id:     this.formStoreId,
      total_mount:  this.formTotalMount,
      purchaseDate: this.formPurchaseDate,
      items:        this.formItems,
    };
  }

  onSave(): void {
    if (!this.formUserId || !this.formStoreId || !this.formPurchaseDate) return;
    this.isSaving.set(true);

    const payload = this.buildPayload();

    if (this.modalMode() === 'create') {
      this.svc.create(payload).subscribe({
        next: () => {
          this.toast.success('Ticket creado correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo crear el ticket.'); this.isSaving.set(false); },
      });
    } else {
      this.svc.update(this.editingId()!, payload).subscribe({
        next: () => {
          this.toast.success('Ticket actualizado correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => { this.toast.error('No se pudo actualizar el ticket.'); this.isSaving.set(false); },
      });
    }
  }

  async onDelete(event: Event, t: Ticket): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar ticket?',
      message:    `Vas a eliminar el ticket del ${t.purchaseDate} por ${t.total_amount} €. ¿Deseas continuar?`,
      entityName: t.id,
    });
    if (!confirmed) return;

    this.svc.delete(t.id).subscribe({
      next:  () => { this.toast.success('Ticket eliminado correctamente.'); this.svc.loadAll(); },
      error: () => { this.toast.error('No se pudo eliminar el ticket.'); },
    });
  }
}
