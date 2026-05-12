import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import {
  UserFavorite,
  Recipe,
  CreateRecipePayload,
  CreateUserFavoritePayload,
} from '../../core/models/user-favorites.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class UserFavoritesService {
  private readonly http = inject(HttpClient);

  readonly favorites        = signal<UserFavorite[]>([]);
  readonly selectedFavorite = signal<UserFavorite | null>(null);
  readonly isLoading        = signal(false);
  readonly isLoadingDetail  = signal(false);
  readonly error            = signal<string | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<UserFavorite[]>(`${BASE}/user-favorites`).subscribe({
      next:  data => { this.favorites.set(data); this.isLoading.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar los favoritos.'); this.isLoading.set(false); },
    });
  }

  loadById(id: string): void {
    this.isLoadingDetail.set(true);
    this.error.set(null);
    this.http.get<UserFavorite>(`${BASE}/user-favorites/${id}`).subscribe({
      next:  fav => { this.selectedFavorite.set(fav); this.isLoadingDetail.set(false); },
      error: ()  => { this.error.set('No se pudo cargar el favorito.'); this.isLoadingDetail.set(false); },
    });
  }

  /**
   * Flujo de creación en dos pasos:
   * 1. POST /api/v1/recipes          → crea la receta, obtiene recipe.id
   * 2. POST /api/v1/user-favorites   → crea el favorito con { user_id, recipe_id }
   */
  createWithRecipe(recipePayload: CreateRecipePayload, userId: string) {
    return this.http.post<Recipe>(`${BASE}/recipes`, recipePayload).pipe(
      switchMap(recipe =>
        this.http.post<UserFavorite>(`${BASE}/user-favorites`, {
          user_id:   userId,
          recipe_id: recipe.id,
        } satisfies CreateUserFavoritePayload)
      ),
    );
  }

  /**
   * Flujo de edición en dos pasos:
   * 1. PUT /api/v1/recipes/:recipeId          → actualiza los campos de la receta
   * 2. PUT /api/v1/user-favorites/:favoriteId → actualiza el vínculo (user_id / recipe_id)
   */
  updateWithRecipe(
    favoriteId: string,
    recipeId: string,
    recipePayload: CreateRecipePayload,
    userId: string,
  ) {
    return this.http.put<Recipe>(`${BASE}/recipes/${recipeId}`, recipePayload).pipe(
      switchMap(() =>
        this.http.put<UserFavorite>(`${BASE}/user-favorites/${favoriteId}`, {
          user_id:   userId,
          recipe_id: recipeId,
        } satisfies CreateUserFavoritePayload)
      ),
    );
  }

  delete(id: string) {
    return this.http.delete(`${BASE}/user-favorites/${id}`);
  }
}
