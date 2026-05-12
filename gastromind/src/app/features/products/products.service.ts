import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, CreateProductPayload } from '../../core/models/products.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  readonly products   = signal<Product[]>([]);
  readonly isLoading  = signal(false);
  readonly error      = signal<string | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Product[]>(`${BASE}/products`).subscribe({
      next:  data => { this.products.set(data); this.isLoading.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar los productos.'); this.isLoading.set(false); },
    });
  }

  create(payload: CreateProductPayload) {
    return this.http.post<Product>(`${BASE}/products`, payload);
  }

  update(id: string, payload: CreateProductPayload) {
    return this.http.put<Product>(`${BASE}/products/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${BASE}/products/${id}`);
  }
}
