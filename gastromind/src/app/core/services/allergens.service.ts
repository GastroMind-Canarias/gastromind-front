import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Allergen } from '../models/users.models';

const BASE = '/api/v1';

/**
 * AllergensService — carga el catálogo global de alérgenos.
 * Usado por ProductsList para resolver allergen_id → nombre
 * y para poblar el desplegable en los modales de productos.
 */
@Injectable({ providedIn: 'root' })
export class AllergensService {
  private readonly http = inject(HttpClient);

  readonly allergens  = signal<Allergen[]>([]);
  readonly isLoading  = signal(false);

  loadAll(): void {
    if (this.allergens().length) return; // ya cargados
    this.isLoading.set(true);
    this.http.get<Allergen[]>(`${BASE}/allergens`).subscribe({
      next:  data => { this.allergens.set(data); this.isLoading.set(false); },
      error: ()   => { this.isLoading.set(false); },
    });
  }

  nameById(id: string | null): string {
    if (!id) return '—';
    return this.allergens().find(a => a.id === id)?.name ?? id.slice(0, 8) + '…';
  }
}
