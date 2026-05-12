import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FridgesService } from '../fridges.service';
import { HouseholdsService } from '../../households/households.service';
import { ProductsService } from '../../products/products.service';
import { CategoriesService } from '../../categories/categories.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import {
  FridgeItem,
  FridgeItemStatus,
  FRIDGE_ITEM_STATUS_LABELS,
  ALL_FRIDGE_ITEM_STATUSES,
} from '../../../core/models/fridges.models';

type ItemModalMode = 'add' | 'edit';
type FilterMode    = 'all' | 'expiring' | 'category';

@Component({
  selector: 'app-fridge-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fridge-detail.component.html',
  styleUrl: './fridge-detail.component.css',
})
export class FridgeDetailComponent implements OnInit {
  protected readonly svc          = inject(FridgesService);
  protected readonly houseSvc     = inject(HouseholdsService);
  protected readonly productsSvc  = inject(ProductsService);
  protected readonly categoriesSvc = inject(CategoriesService);
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly toast          = inject(ToastService);
  private readonly confirm        = inject(ConfirmDialogService);

  /* ── Constants for template ── */
  readonly statusLabels    = FRIDGE_ITEM_STATUS_LABELS;
  readonly allStatuses     = ALL_FRIDGE_ITEM_STATUSES;

  /* ── Filter state ── */
  readonly filterMode      = signal<FilterMode>('all');
  readonly categoryId      = signal('');

  /* ── Edit fridge modal ── */
  readonly showFridgeModal = signal(false);
  readonly isSavingFridge  = signal(false);
  formHouseholdId          = '';

  /* ── Item modal ── */
  readonly showItemModal   = signal(false);
  readonly itemModalMode   = signal<ItemModalMode>('add');
  readonly editingItemId   = signal<string | null>(null);
  readonly isSavingItem    = signal(false);

  /* Item form */
  itemProductId    = '';
  itemQuantity     = 1;
  itemExpiration   = '';
  itemStatus: FridgeItemStatus = 'GOOD';

  /* ── Consume partial ── */
  readonly showConsumeModal   = signal(false);
  readonly consumingItemId    = signal<string | null>(null);
  readonly isSavingConsume    = signal(false);
  consumeQuantity             = 1;

  /* ── Busy set for item actions ── */
  readonly busyItems = signal<Set<string>>(new Set());

  /* ── Computed ── */
  readonly householdOptions = computed(() => this.houseSvc.households());

  readonly resolvedHousehold = computed(() => {
    const f = this.svc.selectedFridge();
    if (!f) return null;
    return this.houseSvc.households().find(h => h.id === f.household_id) ?? null;
  });

  private get fridgeId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.svc.loadById(this.fridgeId);
    this.svc.loadItems(this.fridgeId);
    this.houseSvc.loadAll();
    this.productsSvc.loadAll();
    this.categoriesSvc.loadAll();
  }

  /* ── Navigation ── */
  goBack(): void {
    this.router.navigate(['/fridges']);
  }

  shortId(id: string): string {
    return id.slice(0, 8) + '…';
  }

  productName(productId: string): string {
    return this.productsSvc.products().find(p => p.id === productId)?.name ?? this.shortId(productId);
  }

  /* ── Filter ── */
  setFilter(mode: FilterMode): void {
    this.filterMode.set(mode);
    if (mode === 'all')      this.svc.loadItems(this.fridgeId);
    if (mode === 'expiring') this.svc.loadExpiringItems(this.fridgeId);
    // category: triggered on search button
  }

  applyCategory(): void {
    const cat = this.categoryId().trim();
    if (!cat) return;
    this.svc.loadItemsByCategory(this.fridgeId, cat);
  }

  /* ── Status helpers ── */
  statusLabel(s: FridgeItemStatus): string {
    return FRIDGE_ITEM_STATUS_LABELS[s] ?? s;
  }

  statusClass(s: FridgeItemStatus): string {
    const map: Record<FridgeItemStatus, string> = {
      GOOD:     'badge--green',
      EXPIRING: 'badge--orange',
      CONSUMED: 'badge--gray',
      EXPIRED:  'badge--red',
    };
    return map[s] ?? '';
  }

  /* ── Edit fridge ── */
  openFridgeModal(): void {
    const f = this.svc.selectedFridge();
    this.formHouseholdId = f?.household_id ?? '';
    this.showFridgeModal.set(true);
  }

  closeFridgeModal(): void { this.showFridgeModal.set(false); }

  onSaveFridge(): void {
    if (!this.formHouseholdId) return;
    this.isSavingFridge.set(true);
    this.svc.update(this.fridgeId, { household_id: this.formHouseholdId }).subscribe({
      next: () => {
        this.toast.success('Nevera actualizada correctamente.');
        this.svc.loadById(this.fridgeId);
        this.closeFridgeModal();
        this.isSavingFridge.set(false);
      },
      error: () => {
        this.toast.error('No se pudo actualizar la nevera.');
        this.isSavingFridge.set(false);
      },
    });
  }

  async onDeleteFridge(): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: '¿Eliminar nevera?',
      message: 'Vas a eliminar esta nevera y todos sus items. ¿Deseas continuar?',
      entityName: this.fridgeId,
    });
    if (!confirmed) return;

    this.svc.delete(this.fridgeId).subscribe({
      next: () => {
        this.toast.success('Nevera eliminada correctamente.');
        this.router.navigate(['/fridges']);
      },
      error: () => {
        this.toast.error('No se pudo eliminar la nevera. Inténtalo de nuevo.'),
        undefined;
      },
    });
  }

  /* ── Item modal ── */
  openAddItem(): void {
    this.itemModalMode.set('add');
    this.editingItemId.set(null);
    this.itemProductId  = '';
    this.itemQuantity   = 1;
    this.itemExpiration = '';
    this.itemStatus     = 'GOOD';
    this.showItemModal.set(true);
  }

  openEditItem(item: FridgeItem): void {
    this.itemModalMode.set('edit');
    this.editingItemId.set(item.id);
    this.itemProductId  = item.productId;
    this.itemQuantity   = item.quantity;
    this.itemExpiration = item.expirationDate ?? '';
    this.itemStatus     = item.status;
    this.showItemModal.set(true);
  }

  closeItemModal(): void { this.showItemModal.set(false); }

  onSaveItem(): void {
    if (!this.itemProductId || this.itemQuantity <= 0) return;
    this.isSavingItem.set(true);

    const payload = {
      productId:      this.itemProductId,
      fridgeId:       this.fridgeId,
      quantity:       this.itemQuantity,
      expirationDate: this.itemExpiration,
      status:         this.itemStatus,
    };

    if (this.itemModalMode() === 'add') {
      this.svc.addItem(payload).subscribe({
        next: () => {
          this.toast.success('Item añadido correctamente.');
          this.svc.loadItems(this.fridgeId);
          this.closeItemModal();
          this.isSavingItem.set(false);
        },
        error: () => {
          this.toast.error('No se pudo añadir el item.');
          this.isSavingItem.set(false);
        },
      });
    } else {
      this.svc.updateItem(this.editingItemId()!, payload).subscribe({
        next: () => {
          this.toast.success('Item actualizado correctamente.');
          this.svc.loadItems(this.fridgeId);
          this.closeItemModal();
          this.isSavingItem.set(false);
        },
        error: () => {
          this.toast.error('No se pudo actualizar el item.');
          this.isSavingItem.set(false);
        },
      });
    }
  }

  /* ── Item actions ── */
  private setBusy(id: string, busy: boolean): void {
    this.busyItems.update(s => {
      const next = new Set(s);
      busy ? next.add(id) : next.delete(id);
      return next;
    });
  }

  isBusy(id: string): boolean {
    return this.busyItems().has(id);
  }

  onMarkConsumed(item: FridgeItem): void {
    this.setBusy(item.id, true);
    this.svc.markConsumed(item.id).subscribe({
      next: () => {
        this.toast.success('Item marcado como consumido.');
        this.svc.loadItems(this.fridgeId);
        this.setBusy(item.id, false);
      },
      error: () => {
        this.toast.error('No se pudo marcar el item como consumido.');
        this.setBusy(item.id, false);
      },
    });
  }

  openConsumeModal(item: FridgeItem): void {
    this.consumingItemId.set(item.id);
    this.consumeQuantity = 1;
    this.showConsumeModal.set(true);
  }

  closeConsumeModal(): void { this.showConsumeModal.set(false); }

  onConsumePartial(): void {
    const id = this.consumingItemId();
    if (!id || this.consumeQuantity <= 0) return;
    this.isSavingConsume.set(true);
    this.svc.consumePartial(id, this.consumeQuantity).subscribe({
      next: () => {
        this.toast.success('Cantidad consumida correctamente.');
        this.svc.loadItems(this.fridgeId);
        this.closeConsumeModal();
        this.isSavingConsume.set(false);
      },
      error: () => {
        this.toast.error('No se pudo consumir la cantidad indicada.');
        this.isSavingConsume.set(false);
      },
    });
  }

  async onDeleteItem(item: FridgeItem): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: '¿Eliminar item?',
      message: `Vas a eliminar el item con ID ${item.id.slice(0, 8)}… de la nevera. ¿Deseas continuar?`,
      entityName: item.id,
    });
    if (!confirmed) return;

    this.setBusy(item.id, true);
    this.svc.deleteItem(item.id).subscribe({
      next: () => {
        this.toast.success('Item eliminado correctamente.');
        this.svc.loadItems(this.fridgeId);
        this.setBusy(item.id, false);
      },
      error: () => {
        this.toast.error('No se pudo eliminar el item. Inténtalo de nuevo.');
        this.setBusy(item.id, false);
      },
    });
  }
}
