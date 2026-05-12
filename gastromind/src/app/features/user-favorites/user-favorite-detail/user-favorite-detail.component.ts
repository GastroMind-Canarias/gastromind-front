import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserFavoritesService } from '../user-favorites.service';
import { UsersService } from '../../users/users.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { DIFFICULTY_OPTIONS, DIFFICULTY_LABELS } from '../../../core/models/user-favorites.models';
import { ALL_APPLIANCES, APPLIANCE_LABELS } from '../../../core/models/households.models';

@Component({
  selector: 'app-user-favorite-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-favorite-detail.component.html',
  styleUrl: './user-favorite-detail.component.css',
})
export class UserFavoriteDetailComponent implements OnInit {
  protected readonly svc      = inject(UserFavoritesService);
  protected readonly usersSvc = inject(UsersService);
  private   readonly route    = inject(ActivatedRoute);
  private   readonly router   = inject(Router);
  private   readonly toast    = inject(ToastService);
  private   readonly confirm  = inject(ConfirmDialogService);

  readonly allAppliances    = ALL_APPLIANCES;
  readonly applianceLabels  = APPLIANCE_LABELS;
  readonly difficultyOptions = DIFFICULTY_OPTIONS;
  readonly difficultyLabels  = DIFFICULTY_LABELS;

  /* ── Resolved user ── */
  readonly resolvedUser = computed(() => {
    const fav = this.svc.selectedFavorite();
    if (!fav) return null;
    return this.usersSvc.users().find(u => u.id === fav.user_id) ?? null;
  });

  /* ── Edit modal ── */
  readonly showModal = signal(false);
  readonly isSaving  = signal(false);

  formUserId        = '';
  formTitle         = '';
  formInstructions  = '';
  formServings      = 1;
  formPrepTime      = 30;
  formAppliance     = 'HORNO';
  formDifficulty    = 'EASY';
  formCreatedAt     = '';

  private get favoriteId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.svc.loadById(this.favoriteId);
    this.usersSvc.loadAll();
  }

  goBack(): void { this.router.navigate(['/user-favorites']); }

  shortId(id: string): string { return id.slice(0, 8) + '…'; }

  diffLabel(val: string): string {
    return this.difficultyLabels[val] ?? val;
  }

  appLabel(val: string): string {
    return this.applianceLabels[val as keyof typeof this.applianceLabels] ?? val;
  }

  /* ── Edit modal ── */
  openEdit(): void {
    const fav = this.svc.selectedFavorite()!;
    this.formUserId       = fav.user_id;
    this.formTitle        = fav.recipe.title;
    this.formInstructions = fav.recipe.instructions;
    this.formServings     = fav.recipe.servings;
    this.formPrepTime     = fav.recipe.prep_time;
    this.formAppliance    = fav.recipe.appliance_needed;
    this.formDifficulty   = fav.recipe.difficulty;
    this.formCreatedAt    = fav.recipe.created_at;
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  get isFormValid(): boolean {
    return !!(
      this.formUserId &&
      this.formTitle.trim() &&
      this.formInstructions.trim() &&
      this.formServings > 0 &&
      this.formPrepTime > 0
    );
  }

  onSave(): void {
    if (!this.isFormValid) return;
    const fav = this.svc.selectedFavorite()!;
    this.isSaving.set(true);

    const recipePayload = {
      title:            this.formTitle.trim(),
      instructions:     this.formInstructions.trim(),
      servings:         this.formServings,
      prep_time:        this.formPrepTime,
      appliance_needed: this.formAppliance,
      difficulty:       this.formDifficulty,
      created_at:       this.formCreatedAt,
    };

    this.svc.updateWithRecipe(
      this.favoriteId,
      fav.recipe.id,
      recipePayload,
      this.formUserId,
    ).subscribe({
      next: () => {
        this.toast.success('Favorito actualizado correctamente.');
        this.svc.loadById(this.favoriteId);
        this.closeModal();
        this.isSaving.set(false);
      },
      error: () => {
        this.toast.error('No se pudo actualizar el favorito.');
        this.isSaving.set(false);
      },
    });
  }

  async onDelete(): Promise<void> {
    const fav = this.svc.selectedFavorite();
    if (!fav) return;

    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar favorito?',
      message:    `Vas a eliminar "${fav.recipe.title}" de los favoritos. Esta acción no se puede deshacer.`,
      entityName: fav.recipe.title,
    });
    if (!confirmed) return;

    this.svc.delete(fav.id).subscribe({
      next: () => {
        this.toast.success('Favorito eliminado correctamente.');
        this.router.navigate(['/user-favorites']);
      },
      error: () => this.toast.error('No se pudo eliminar el favorito.'),
    });
  }
}
