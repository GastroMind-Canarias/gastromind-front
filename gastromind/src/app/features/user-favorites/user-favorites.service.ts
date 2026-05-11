import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  UsualPurchase,
  Product,
  CreateUsualPurchasePayload,
} from '../../core/models/usual-purchases.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class UserFavoritesService {
  private readonly http = inject(HttpClient);

  readonly purchases         = signal<UsualPurchase[]>([]);
  readonly selectedPurchase  = signal<UsualPurchase | null>(null);
  readonly selectedProduct   = signal<Product | null>(null);
  readonly productMap        = signal<Record<string, string>>({});
  readonly isLoading         = signal(false);
  readonly isLoadingDetail   = signal(false);
  readonly error             = signal<string | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<UsualPurchase[]>(`${BASE}/usual-purchases`).subscribe({
      next:  data => { this.purchases.set(data); this.isLoading.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar las compras habituales.'); this.isLoading.set(false); },
    });
  }

  loadById(id: string): void {
    this.isLoadingDetail.set(true);
    this.selectedProduct.set(null);
    this.error.set(null);
    this.http.get<UsualPurchase>(`${BASE}/usual-purchases/${id}`).subscribe({
      next:  p  => { this.selectedPurchase.set(p); this.isLoadingDetail.set(false); },
      error: () => { this.error.set('No se pudo cargar la compra habitual.'); this.isLoadingDetail.set(false); },
    });
  }

  create(payload: CreateUsualPurchasePayload) {
    return this.http.post<UsualPurchase>(`${BASE}/usual-purchases`, payload);
  }

  update(id: string, payload: CreateUsualPurchasePayload) {
    return this.http.put<UsualPurchase>(`${BASE}/usual-purchases/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${BASE}/usual-purchases/${id}`);
  }

  loadProduct(productId: string): void {
    this.selectedProduct.set(null);
    this.http.get<Product>(`${BASE}/products/${productId}`).subscribe({
      next:  p  => this.selectedProduct.set(p),
      error: () => this.selectedProduct.set(null),
    });
  }

  loadProducts(): void {
    const ids = [...new Set(this.purchases().map(p => p.product_id))];
    if (!ids.length) return;
    const requests = Object.fromEntries(
      ids.map(id => [id, this.http.get<Product>(`${BASE}/products/${id}`)])
    );
    forkJoin(requests).subscribe({
      next: results => {
        const map: Record<string, string> = {};
        for (const [id, p] of Object.entries(results)) {
          map[id] = (p as Product).name;
        }
        this.productMap.set(map);
      },
      error: () => {},
    });
  }
}
