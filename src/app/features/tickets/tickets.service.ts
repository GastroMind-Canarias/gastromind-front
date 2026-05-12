import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ticket, CreateTicketPayload, Store } from '../../core/models/tickets.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private readonly http = inject(HttpClient);

  readonly tickets         = signal<Ticket[]>([]);
  readonly selectedTicket  = signal<Ticket | null>(null);
  readonly selectedStore   = signal<Store | null>(null);
  readonly isLoading       = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly error           = signal<string | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Ticket[]>(`${BASE}/tickets`).subscribe({
      next:  data => { this.tickets.set(data); this.isLoading.set(false); },
      error: ()   => { this.error.set('No se pudieron cargar los tickets.'); this.isLoading.set(false); },
    });
  }

  loadById(id: string): void {
    this.isLoadingDetail.set(true);
    this.error.set(null);
    this.http.get<Ticket>(`${BASE}/tickets/${id}`).subscribe({
      next:  t  => { this.selectedTicket.set(t); this.isLoadingDetail.set(false); },
      error: () => { this.error.set('No se pudo cargar el ticket.'); this.isLoadingDetail.set(false); },
    });
  }

  create(payload: CreateTicketPayload) {
    return this.http.post<Ticket>(`${BASE}/tickets`, payload);
  }

  update(id: string, payload: CreateTicketPayload) {
    return this.http.put<Ticket>(`${BASE}/tickets/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${BASE}/tickets/${id}`);
  }

  loadStore(storeId: string): void {
    this.selectedStore.set(null);
    this.http.get<Store>(`${BASE}/stores/${storeId}`).subscribe({
      next:  s  => this.selectedStore.set(s),
      error: () => this.selectedStore.set(null),
    });
  }
}
