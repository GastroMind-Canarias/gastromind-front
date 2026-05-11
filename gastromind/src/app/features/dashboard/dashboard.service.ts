import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ApiUser, Household, Ticket, DashboardStats } from '../../core/models/dashboard.models';

const BASE_URL = '/api/v1';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly _stats = signal<DashboardStats>({
    totalUsers:          0,
    totalHouseholds:     0,
    totalTickets:        0,
    totalFridges:        0,
    totalUsualPurchases: 0,
    totalUnits:          0,
  });

  readonly stats = this._stats.asReadonly();

  readonly hasData = computed(() => {
    const s = this._stats();
    return s.totalUsers > 0 || s.totalHouseholds > 0 || s.totalTickets > 0
        || s.totalFridges > 0 || s.totalUsualPurchases > 0 || s.totalUnits > 0;
  });

  loadStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      users:           this.http.get<ApiUser[]>(`${BASE_URL}/users`),
      households:      this.http.get<Household[]>(`${BASE_URL}/households`),
      tickets:         this.http.get<Ticket[]>(`${BASE_URL}/tickets`),
      fridges:         this.http.get<unknown[]>(`${BASE_URL}/fridges`),
      usualPurchases:  this.http.get<unknown[]>(`${BASE_URL}/usual-purchases`),
      units:           this.http.get<unknown[]>(`${BASE_URL}/units`),
    }).subscribe({
      next: ({ users, households, tickets, fridges, usualPurchases, units }) => {
        this._stats.set({
          totalUsers:          Array.isArray(users)          ? users.length          : 0,
          totalHouseholds:     Array.isArray(households)     ? households.length     : 0,
          totalTickets:        Array.isArray(tickets)        ? tickets.length        : 0,
          totalFridges:        Array.isArray(fridges)        ? fridges.length        : 0,
          totalUsualPurchases: Array.isArray(usualPurchases) ? usualPurchases.length : 0,
          totalUnits:          Array.isArray(units)          ? units.length          : 0,
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
