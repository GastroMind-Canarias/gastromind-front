import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category, CreateCategoryPayload } from '../../core/models/categories.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);

  readonly categories = signal<Category[]>([]);
  readonly isLoading  = signal(false);
  readonly error      = signal<string | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Category[]>(`${BASE}/categories`).subscribe({
      next:  data => { this.categories.set(data); this.isLoading.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar las categorías.'); this.isLoading.set(false); },
    });
  }

  create(payload: CreateCategoryPayload) {
    return this.http.post<Category>(`${BASE}/categories`, payload);
  }

  update(id: string, payload: CreateCategoryPayload) {
    return this.http.put<Category>(`${BASE}/categories/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${BASE}/categories/${id}`);
  }
}
