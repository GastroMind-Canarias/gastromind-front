import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HouseholdsService } from '../households.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import {
  ALL_APPLIANCES,
  APPLIANCE_LABELS,
  Appliance,
} from '../../../core/models/households.models';

@Component({
  selector: 'app-household-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './household-detail.component.html',
  styleUrl: './household-detail.component.css',
})
export class HouseholdDetailComponent implements OnInit {
  protected readonly svc    = inject(HouseholdsService);
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly toast    = inject(ToastService);
  private readonly confirm  = inject(ConfirmDialogService);

  readonly selectedAppliance  = signal<Appliance | ''>('');
  readonly isAddingAppliance  = signal(false);
  readonly isGeneratingInvite = signal(false);
  readonly inviteToken        = signal<string | null>(null);
  readonly tokenCopied        = signal(false);
  /** IDs de miembros con una acción en curso */
  readonly busyMembers        = signal<Set<string>>(new Set());

  /* ── Edit modal ── */
  readonly showEditModal = signal(false);
  readonly isSavingEdit  = signal(false);
  formName = '';

  /** Dispositivos disponibles que el hogar aún no tiene */
  readonly availableAppliances = computed(() => {
    const current = this.svc.selectedHousehold()?.appliances ?? [];
    return ALL_APPLIANCES.filter(a => !current.includes(a));
  });

  constructor() {
    effect(() => {
      const avail = this.availableAppliances();
      if (avail.length && !avail.includes(this.selectedAppliance() as Appliance)) {
        this.selectedAppliance.set(avail[0]);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.loadById(id);
    this.svc.loadMembers(id);
  }

  private get householdId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  isBusy(memberId: string): boolean {
    return this.busyMembers().has(memberId);
  }

  private setBusy(memberId: string, busy: boolean): void {
    this.busyMembers.update(s => {
      const next = new Set(s);
      busy ? next.add(memberId) : next.delete(memberId);
      return next;
    });
  }

  goBack(): void {
    this.router.navigate(['/households']);
  }

  openEdit(): void {
    const h = this.svc.selectedHousehold();
    if (!h) return;
    this.formName = h.name;
    this.showEditModal.set(true);
  }

  closeEdit(): void { this.showEditModal.set(false); }

  onSaveEdit(): void {
    if (!this.formName.trim()) return;
    const h = this.svc.selectedHousehold();
    if (!h) return;
    this.isSavingEdit.set(true);
    this.svc.update(h.id, { name: this.formName.trim() }).subscribe({
      next: () => {
        this.toast.success('Hogar actualizado correctamente.');
        this.svc.loadById(h.id);
        this.closeEdit();
        this.isSavingEdit.set(false);
      },
      error: () => {
        this.toast.error('No se pudo actualizar el hogar.');
        this.isSavingEdit.set(false);
      },
    });
  }

  applianceLabel(key: string): string {
    return APPLIANCE_LABELS[key as Appliance] ?? key;
  }

  onAddAppliance(): void {
    const h = this.svc.selectedHousehold();
    const appliance = this.selectedAppliance();
    if (!h || !appliance) return;

    this.isAddingAppliance.set(true);
    this.svc.addAppliance(h.id, appliance).subscribe({
      next: () => {
        this.toast.success(`${this.applianceLabel(appliance)} añadido correctamente.`);
        this.svc.loadById(h.id);
        this.isAddingAppliance.set(false);
      },
      error: () => {
        this.toast.error('No se pudo añadir el dispositivo. Inténtalo de nuevo.');
        this.isAddingAppliance.set(false);
      },
    });
  }

  onGenerateInvite(): void {
    const h = this.svc.selectedHousehold();
    if (!h) return;

    this.isGeneratingInvite.set(true);
    this.inviteToken.set(null);
    this.svc.generateInvite(h.id).subscribe({
      next: (res: unknown) => {
        const token = typeof res === 'string'
          ? res
          : (res as Record<string, string>)?.['token']
            ?? (res as Record<string, string>)?.['inviteToken']
            ?? JSON.stringify(res);
        this.inviteToken.set(token);
        this.toast.success('Token de invitación generado.');
        this.isGeneratingInvite.set(false);
      },
      error: () => {
        this.toast.error('No se pudo generar la invitación. Inténtalo de nuevo.');
        this.isGeneratingInvite.set(false);
      },
    });
  }

  copyToken(): void {
    const token = this.inviteToken();
    if (!token) return;
    navigator.clipboard.writeText(token).then(() => {
      this.tokenCopied.set(true);
      setTimeout(() => this.tokenCopied.set(false), 2000);
    });
  }

  onPromote(member: { id: string; name: string }): void {
    this.setBusy(member.id, true);
    this.svc.promoteMember(this.householdId, member.id).subscribe({
      next: () => {
        this.toast.success(`${member.name} ascendido a Owner correctamente.`);
        this.svc.loadMembers(this.householdId);
        this.setBusy(member.id, false);
      },
      error: () => {
        this.toast.error(`No se pudo ascender a ${member.name}. Inténtalo de nuevo.`);
        this.setBusy(member.id, false);
      },
    });
  }

  async onRemoveMember(member: { id: string; name: string }): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: '¿Expulsar miembro?',
      message: `Vas a expulsar a ${member.name} de este hogar. ¿Deseas continuar?`,
      entityName: member.name,
    });

    if (!confirmed) return;

    this.setBusy(member.id, true);
    this.svc.removeMember(this.householdId, member.id).subscribe({
      next: () => {
        this.toast.success(`${member.name} expulsado del hogar.`);
        this.svc.loadMembers(this.householdId);
        this.setBusy(member.id, false);
      },
      error: () => {
        this.toast.error(`No se pudo expulsar a ${member.name}. Inténtalo de nuevo.`);
        this.setBusy(member.id, false);
      },
    });
  }

  async onDelete(): Promise<void> {
    const h = this.svc.selectedHousehold();
    if (!h) return;

    const confirmed = await this.confirm.confirm({
      title: '¿Eliminar hogar?',
      message: `Vas a eliminar "${h.name}" y todos sus datos. ¿Deseas continuar?`,
      entityName: h.id,
    });

    if (!confirmed) return;

    this.svc.delete(h.id).subscribe({
      next: () => {
        this.toast.success(`Hogar "${h.name}" eliminado correctamente.`);
        this.router.navigate(['/households']);
      },
      error: () => {
        this.toast.error(`No se pudo eliminar "${h.name}". Inténtalo de nuevo.`);
      },
    });
  }
}
