import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserFavoritesService } from '../user-favorites.service';
import { UsersService } from '../../users/users.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/confirm-dialog/confirm-dialog.service';
import { UserFavorite, DIFFICULTY_OPTIONS, DIFFICULTY_LABELS } from '../../../core/models/user-favorites.models';
import { ALL_APPLIANCES, APPLIANCE_LABELS } from '../../../core/models/households.models';
import type { SortDir } from '../../../core/models/tickets.models';

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
  private   readonly router   = inject(Router);
  private   readonly toast    = inject(ToastService);
  private   readonly confirm  = inject(ConfirmDialogService);

  readonly allAppliances    = ALL_APPLIANCES;
  readonly applianceLabels  = APPLIANCE_LABELS;
  readonly difficultyOptions = DIFFICULTY_OPTIONS;
  readonly difficultyLabels  = DIFFICULTY_LABELS;

  /* ── Search / sort ── */
  readonly searchQuery = signal('');
  readonly sortDir     = signal<SortDir>('asc');

  /* ── Computed view ── */
  readonly displayFavorites = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const users = this.usersSvc.users();
    const dir   = this.sortDir();

    let result = this.svc.favorites().map(fav => ({
      fav,
      userName: users.find(u => u.id === fav.user_id)?.name ?? fav.user_id.slice(0, 8) + '…',
    }));

    if (query) {
      result = result.filter(r =>
        r.userName.toLowerCase().includes(query) ||
        r.fav.recipe.title.toLowerCase().includes(query) ||
        r.fav.recipe.appliance_needed.toLowerCase().includes(query) ||
        r.fav.recipe.difficulty.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const cmp = a.fav.recipe.title.localeCompare(b.fav.recipe.title, 'es');
      return dir === 'asc' ? cmp : -cmp;
    });

    return result;
  });

  /* ── Modal ── */
  readonly showModal      = signal(false);
  readonly modalMode      = signal<'create' | 'edit'>('create');
  readonly editingId      = signal<string | null>(null);
  readonly editingRecipeId = signal<string | null>(null);
  readonly isSaving       = signal(false);

  /* ── Form ── */
  formUserId          = '';
  formTitle           = '';
  formInstructions    = '';
  formServings        = 1;
  formPrepTime        = 30;
  formAppliance       = 'HORNO';
  formDifficulty      = 'EASY';
  formCreatedAt       = new Date().toISOString().slice(0, 10);

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

  diffLabel(val: string): string {
    return this.difficultyLabels[val] ?? val;
  }

  appLabel(val: string): string {
    return this.applianceLabels[val as keyof typeof this.applianceLabels] ?? val;
  }

  toggleSort(): void {
    this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  /* ── Modal ── */
  openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.editingRecipeId.set(null);
    this.formUserId       = '';
    this.formTitle        = '';
    this.formInstructions = '';
    this.formServings     = 1;
    this.formPrepTime     = 30;
    this.formAppliance    = 'HORNO';
    this.formDifficulty   = 'EASY';
    this.formCreatedAt    = new Date().toISOString().slice(0, 10);
    this.showModal.set(true);
  }

  openEdit(event: Event, fav: UserFavorite): void {
    event.stopPropagation();
    this.modalMode.set('edit');
    this.editingId.set(fav.id);
    this.editingRecipeId.set(fav.recipe.id);
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

    if (this.modalMode() === 'create') {
      this.svc.createWithRecipe(recipePayload, this.formUserId).subscribe({
        next: () => {
          this.toast.success('Favorito creado correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('No se pudo crear el favorito.');
          this.isSaving.set(false);
        },
      });
    } else {
      this.svc.updateWithRecipe(
        this.editingId()!,
        this.editingRecipeId()!,
        recipePayload,
        this.formUserId,
      ).subscribe({
        next: () => {
          this.toast.success('Favorito actualizado correctamente.');
          this.svc.loadAll();
          this.closeModal();
          this.isSaving.set(false);
        },
        error: () => {
          this.toast.error('No se pudo actualizar el favorito.');
          this.isSaving.set(false);
        },
      });
    }
  }

  async onDelete(event: Event, fav: UserFavorite): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({
      title:      '¿Eliminar favorito?',
      message:    `Vas a eliminar "${fav.recipe.title}" de los favoritos. Esta acción no se puede deshacer.`,
      entityName: fav.recipe.title,
    });
    if (!confirmed) return;

    this.svc.delete(fav.id).subscribe({
      next:  () => { this.toast.success('Favorito eliminado correctamente.'); this.svc.loadAll(); },
      error: () => { this.toast.error('No se pudo eliminar el favorito.'); },
    });
  }
}
