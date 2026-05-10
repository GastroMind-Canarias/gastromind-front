import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Unit, CreateUnitPayload } from '../../core/models/units.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class UnitsService {
  private readonly http = inject(HttpClient);

  readonly units     = signal<Unit[]>([]);
  readonly isLoading = signal(false);
  readonly error     = signal<string | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Unit[]>(`${BASE}/units`).subscribe({
      next:  data => { this.units.set(data); this.isLoading.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar las unidades.'); this.isLoading.set(false); },
    });
  }

  create(payload: CreateUnitPayload) {
    return this.http.post<Unit>(`${BASE}/units`, payload);
  }

  update(id: string, payload: CreateUnitPayload) {
    return this.http.put<Unit>(`${BASE}/units/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${BASE}/units/${id}`);
  }
}
