import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store, CreateStorePayload } from '../../core/models/stores.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class StoresService {
  private readonly http = inject(HttpClient);

  readonly stores     = signal<Store[]>([]);
  readonly isLoading  = signal(false);
  readonly error      = signal<string | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Store[]>(`${BASE}/stores`).subscribe({
      next:  data => { this.stores.set(data); this.isLoading.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar las tiendas.'); this.isLoading.set(false); },
    });
  }

  create(payload: CreateStorePayload) {
    return this.http.post<Store>(`${BASE}/stores`, payload);
  }

  update(id: string, payload: CreateStorePayload) {
    return this.http.put<Store>(`${BASE}/stores/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${BASE}/stores/${id}`);
  }
}
