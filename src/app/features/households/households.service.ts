import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Household, HouseholdMember } from '../../core/models/households.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class HouseholdsService {
  private http = inject(HttpClient);

  readonly households        = signal<Household[]>([]);
  readonly selectedHousehold = signal<Household | null>(null);
  readonly members           = signal<HouseholdMember[]>([]);
  readonly isLoading         = signal(false);
  readonly isLoadingDetail   = signal(false);
  readonly isLoadingMembers  = signal(false);
  readonly error             = signal<string | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<Household[]>(`${BASE}/households`).subscribe({
      next: data => { this.households.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los hogares.'); this.isLoading.set(false); },
    });
  }

  loadById(id: string): void {
    this.isLoadingDetail.set(true);
    this.error.set(null);
    this.http.get<Household>(`${BASE}/households/${id}`).subscribe({
      next: h => { this.selectedHousehold.set(h); this.isLoadingDetail.set(false); },
      error: () => { this.error.set('No se pudo cargar el hogar.'); this.isLoadingDetail.set(false); },
    });
  }

  create(payload: { name: string }) {
    return this.http.post<Household>(`${BASE}/households`, payload);
  }

  update(id: string, payload: { name: string }) {
    return this.http.put<Household>(`${BASE}/households/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete(`${BASE}/households/${id}`);
  }

  addAppliance(id: string, appliance: string) {
    return this.http.post(`${BASE}/households/${id}/appliances`, null, {
      params: { appliance },
    });
  }

  generateInvite(id: string) {
    return this.http.post<unknown>(`${BASE}/households/${id}/invite`, null, {
      responseType: 'text' as 'json',
    });
  }

  loadMembers(id: string): void {
    this.isLoadingMembers.set(true);
    this.http.get<HouseholdMember[]>(`${BASE}/households/${id}/members`).subscribe({
      next: data => { this.members.set(data); this.isLoadingMembers.set(false); },
      error: () => { this.isLoadingMembers.set(false); },
    });
  }

  promoteMember(id: string, userId: string) {
    return this.http.patch(`${BASE}/households/${id}/promote/${userId}`, null);
  }

  removeMember(id: string, memberUserId: string) {
    return this.http.delete(`${BASE}/households/${id}/members/${memberUserId}`);
  }
}
