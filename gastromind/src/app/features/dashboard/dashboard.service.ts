import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ApiUser, Household, Ticket, DashboardStats } from '../../core/models/dashboard.models';

// Ruta relativa → el proxy de Angular dev-server la redirige al backend real.
const BASE_URL = '/api/v1';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  // ── Estado reactivo (Signals) ──────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly _stats = signal<DashboardStats>({
    totalUsers: 0,
    totalHouseholds: 0,
    totalTickets: 0,
  });

  /** Signal de solo lectura expuesto al exterior. */
  readonly stats = this._stats.asReadonly();

  /** true cuando al menos un contador tiene datos reales. */
  readonly hasData = computed(() => {
    const s = this._stats();
    return s.totalUsers > 0 || s.totalHouseholds > 0 || s.totalTickets > 0;
  });

  // ── Acciones ──────────────────────────────────────────────────────────────

  /**
   * Dispara tres peticiones en paralelo y actualiza los contadores.
   * El interceptor añade ?JWT=<token> a cada una automáticamente.
   *
   * Si la API devuelve paginación ({ content: T[], totalElements: number })
   * ajustar los tipos y el mapeo en el bloque `next`.
   */
  loadStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      users:      this.http.get<ApiUser[]>(`${BASE_URL}/users`),
      households: this.http.get<Household[]>(`${BASE_URL}/households`),
      tickets:    this.http.get<Ticket[]>(`${BASE_URL}/tickets`),
    }).subscribe({
      next: ({ users, households, tickets }) => {
        this._stats.set({
          totalUsers:      Array.isArray(users)      ? users.length      : 0,
          totalHouseholds: Array.isArray(households) ? households.length : 0,
          totalTickets:    Array.isArray(tickets)    ? tickets.length    : 0,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las estadísticas. Intenta de nuevo.');
        this.isLoading.set(false);
      },
    });
  }
}
