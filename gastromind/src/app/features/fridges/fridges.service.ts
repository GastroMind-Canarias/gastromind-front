import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Fridge,
  FridgeItem,
  CreateFridgePayload,
  CreateFridgeItemPayload,
} from '../../core/models/fridges.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class FridgesService {
  private readonly http = inject(HttpClient);

  /* ── Fridges ── */
  readonly fridges         = signal<Fridge[]>([]);
  readonly selectedFridge  = signal<Fridge | null>(null);
  readonly isLoading       = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly error           = signal<string | null>(null);

  /* ── Fridge items ── */
  readonly items           = signal<FridgeItem[]>([]);
  readonly isLoadingItems  = signal(false);
  readonly itemsError      = signal<string | null>(null);

  /* ── Fridges CRUD ── */
  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Fridge[]>(`${BASE}/fridges`).subscribe({
      next:  data => { this.fridges.set(data); this.isLoading.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar las neveras.'); this.isLoading.set(false); },
    });
  }

  loadById(id: string): void {
    this.isLoadingDetail.set(true);
    this.error.set(null);
    this.http.get<Fridge>(`${BASE}/fridges/${id}`).subscribe({
      next:  f  => { this.selectedFridge.set(f); this.isLoadingDetail.set(false); },
      error: () => { this.error.set('No se pudo cargar la nevera.'); this.isLoadingDetail.set(false); },
    });
  }

  create(payload: CreateFridgePayload) {
    return this.http.post<Fridge>(`${BASE}/fridges`, payload);
  }

  update(id: string, payload: CreateFridgePayload) {
    return this.http.put<Fridge>(`${BASE}/fridges/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${BASE}/fridges/${id}`);
  }

  /* ── Fridge items ── */
  loadItems(fridgeId: string): void {
    this.isLoadingItems.set(true);
    this.itemsError.set(null);
    this.http.get<FridgeItem[]>(`${BASE}/fridge-items/fridge/${fridgeId}`).subscribe({
      next:  data => { this.items.set(data); this.isLoadingItems.set(false); },
      error: ()   => { this.itemsError.set('No se pudieron cargar los items.'); this.isLoadingItems.set(false); },
    });
  }

  loadExpiringItems(fridgeId: string): void {
    this.isLoadingItems.set(true);
    this.itemsError.set(null);
    this.http.get<FridgeItem[]>(`${BASE}/fridge-items/fridge/${fridgeId}/expiring`).subscribe({
      next:  data => { this.items.set(data); this.isLoadingItems.set(false); },
      error: ()   => { this.itemsError.set('No se pudieron cargar los items por caducar.'); this.isLoadingItems.set(false); },
    });
  }

  loadItemsByCategory(fridgeId: string, categoryId: string): void {
    this.isLoadingItems.set(true);
    this.itemsError.set(null);
    this.http.get<FridgeItem[]>(`${BASE}/fridge-items/fridge/${fridgeId}/category/${categoryId}`).subscribe({
      next:  data => { this.items.set(data); this.isLoadingItems.set(false); },
      error: ()   => { this.itemsError.set('No se pudieron cargar los items de la categoría.'); this.isLoadingItems.set(false); },
    });
  }

  addItem(payload: CreateFridgeItemPayload) {
    return this.http.post<FridgeItem>(`${BASE}/fridge-items`, payload);
  }

  updateItem(id: string, payload: Partial<CreateFridgeItemPayload>) {
    return this.http.put<FridgeItem>(`${BASE}/fridge-items/${id}`, payload);
  }

  deleteItem(id: string) {
    return this.http.delete(`${BASE}/fridge-items/${id}`);
  }

  markConsumed(id: string) {
    return this.http.put(`${BASE}/fridge-items/${id}/mark-consumed`, null);
  }

  consumePartial(id: string, quantity: number) {
    return this.http.put(`${BASE}/fridge-items/${id}/consume`, { quantity });
  }
}
