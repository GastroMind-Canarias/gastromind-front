import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketsService } from '../tickets.service';
import { UsersService } from '../../users/users.service';
import { HouseholdsService } from '../../households/households.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import {
  Ticket,
  TicketItem,
  CreateTicketPayload,
  CreateTicketItemPayload,
  VerificationStatus,
  ItemSortField,
  SortDir,
  VERIFICATION_STATUS_LABELS,
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
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css',
})
export class TicketDetailComponent implements OnInit {
  protected readonly svc        = inject(TicketsService);
  protected readonly usersSvc   = inject(UsersService);
  protected readonly houseSvc   = inject(HouseholdsService);
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly toast        = inject(ToastService);
  private readonly confirm      = inject(ConfirmDialogService);

  readonly statusLabels = VERIFICATION_STATUS_LABELS;

  /* ── Filter + sort state ── */
  readonly searchProduct = signal('');
  readonly sortField     = signal<ItemSortField>('quantity');
  readonly sortDir       = signal<SortDir>('desc');

  /* ── Computed items view ── */
  readonly displayItems = computed((): TicketItem[] => {
    const ticket = this.svc.selectedTicket();
    if (!ticket) return [];
    const q   = this.searchProduct().trim().toLowerCase();
    const dir = this.sortDir();
    const fld = this.sortField();

    let list = q
      ? ticket.items.filter(i => i.product_name.toLowerCase().includes(q))
      : [...ticket.items];

    list.sort((a, b) => {
      const diff = a[fld] - b[fld];
      return dir === 'asc' ? diff : -diff;
    });
    return list;
  });

  /* ── Resolved names (from loaded services) ── */
  readonly resolvedUser = computed(() => {
    const t = this.svc.selectedTicket();
    if (!t) return null;
    return this.usersSvc.users().find(u => u.id === t.user_id) ?? null;
  });

  readonly resolvedHousehold = computed(() => {
    const t = this.svc.selectedTicket();
    if (!t) return null;
    return this.houseSvc.households().find(h => h.id === t.household_id) ?? null;
  });

  /* ── Edit modal ── */
  readonly showModal  = signal(false);
  readonly isSaving   = signal(false);

  constructor() {
    effect(() => {
      const t = this.svc.selectedTicket();
      if (t?.store_id) this.svc.loadStore(t.store_id);
    });
  }

  formUserId       = '';
  formStoreId      = '';
  formTotalMount   = 0;
  formPurchaseDate = '';
  formItems: CreateTicketItemPayload[] = [BLANK_ITEM()];

  private get ticketId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.svc.loadById(this.ticketId);
    this.usersSvc.loadAll();
    this.houseSvc.loadAll();
  }

  goBack(): void { this.router.navigate(['/tickets']); }

  shortId(id: string): string { return id.slice(0, 8) + '…'; }

  toggleSort(field: ItemSortField): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
  }

  sortIcon(field: ItemSortField): 'asc' | 'desc' | null {
    return this.sortField() === field ? this.sortDir() : null;
  }

  statusClass(s: VerificationStatus): string {
    return s === 'OK' ? 'badge--green' : 'badge--orange';
  }

  /* ── Edit modal ── */
  openEdit(): void {
    const t = this.svc.selectedTicket()!;
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

  addItem(): void   { this.formItems = [...this.formItems, BLANK_ITEM()]; }
  removeItem(i: number): void {
    if (this.formItems.length === 1) return;
    this.formItems = this.formItems.filter((_, idx) => idx !== i);
  }
  trackByIdx(i: number): number { return i; }

  onSave(): void {
    if (!this.formUserId || !this.formStoreId || !this.formPurchaseDate) return;
    this.isSaving.set(true);

    const payload: CreateTicketPayload = {
      user_id:      this.formUserId,
      store_id:     this.formStoreId,
      total_mount:  this.formTotalMount,
      purchaseDate: this.formPurchaseDate,
      items:        this.formItems,
    };

    this.svc.update(this.ticketId, payload).subscribe({
      next: () => {
        this.toast.success('Ticket actualizado correctamente.');
        this.svc.loadById(this.ticketId);
        this.closeModal();
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('No se pudo actualizar el ticket.');
        this.isSaving.set(false);
      },
    });
  }

  async onDelete(): Promise<void> {
    const t = this.svc.selectedTicket();
    if (!t) return;

    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar ticket?',
      message:    `Vas a eliminar el ticket del ${t.purchaseDate} por ${t.total_amount} €. ¿Deseas continuar?`,
      entityName: t.id,
    });
    if (!confirmed) return;

    this.svc.delete(t.id).subscribe({
      next: () => {
        this.toast.success('Ticket eliminado correctamente.');
        this.router.navigate(['/tickets']);
      },
      error: () => this.toast.error('No se pudo eliminar el ticket.'),
    });
  }
}
