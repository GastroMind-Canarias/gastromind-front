import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsualPurchasesService } from '../usual-purchases.service';
import { UsersService } from '../../users/users.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { CreateUsualPurchasePayload } from '../../../core/models/usual-purchases.models';

@Component({
  selector: 'app-usual-purchase-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usual-purchase-detail.component.html',
  styleUrl: './usual-purchase-detail.component.css',
})
export class UsualPurchaseDetailComponent implements OnInit {
  protected readonly svc      = inject(UsualPurchasesService);
  protected readonly usersSvc = inject(UsersService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly toast      = inject(ToastService);
  private readonly confirm    = inject(ConfirmDialogService);

  /* ── Resolved names ── */
  readonly resolvedUser = computed(() => {
    const p = this.svc.selectedPurchase();
    if (!p) return null;
    return this.usersSvc.users().find(u => u.id === p.user_id) ?? null;
  });

  /* ── Edit modal ── */
  readonly showModal = signal(false);
  readonly isSaving  = signal(false);

  formUserId         = '';
  formProductId      = '';
  formTargetQuantity = 1;

  constructor() {
    effect(() => {
      const p = this.svc.selectedPurchase();
      if (p?.product_id) this.svc.loadProduct(p.product_id);
    });
  }

  private get purchaseId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.svc.loadById(this.purchaseId);
    this.usersSvc.loadAll();
  }

  goBack(): void { this.router.navigate(['/usual-purchases']); }

  shortId(id: string): string { return id.slice(0, 8) + '…'; }

  openEdit(): void {
    const p = this.svc.selectedPurchase()!;
    this.formUserId         = p.user_id;
    this.formProductId      = p.product_id;
    this.formTargetQuantity = p.target_quantity;
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  onSave(): void {
    if (!this.formUserId.trim() || !this.formProductId.trim()) return;
    this.isSaving.set(true);

    const payload: CreateUsualPurchasePayload = {
      user_id:         this.formUserId.trim(),
      product_id:      this.formProductId.trim(),
      target_quantity: this.formTargetQuantity,
    };

    this.svc.update(this.purchaseId, payload).subscribe({
      next: () => {
        this.toast.success('Compra habitual actualizada correctamente.');
        this.svc.loadById(this.purchaseId);
        this.closeModal();
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('No se pudo actualizar la compra habitual.');
        this.isSaving.set(false);
      },
    });
  }

  async onDelete(): Promise<void> {
    const p = this.svc.selectedPurchase();
    if (!p) return;

    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar compra habitual?',
      message:    `Vas a eliminar esta compra habitual de forma permanente. ¿Deseas continuar?`,
      entityName: p.id,
    });
    if (!confirmed) return;

    this.svc.delete(p.id).subscribe({
      next: () => {
        this.toast.success('Compra habitual eliminada correctamente.');
        this.router.navigate(['/usual-purchases']);
      },
      error: () => this.toast.error('No se pudo eliminar la compra habitual.'),
    });
  }
}
