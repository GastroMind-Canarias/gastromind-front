import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../../core/models/users.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  readonly users = signal<User[]>([]);
  readonly selectedUser = signal<User | null>(null);
  readonly isLoading = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly error = signal<string | null>(null);

  loadAll(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<User[]>(`${BASE}/users`).subscribe({
      next: data => { this.users.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('No se pudieron cargar los usuarios.'); this.isLoading.set(false); },
    });
  }

  loadById(id: string): void {
    this.isLoadingDetail.set(true);
    this.error.set(null);
    this.http.get<User>(`${BASE}/users/${id}`).subscribe({
      next: u => { this.selectedUser.set(u); this.isLoadingDetail.set(false); },
      error: () => { this.error.set('No se pudo cargar el usuario.'); this.isLoadingDetail.set(false); },
    });
  }

  delete(id: string) {
    return this.http.delete(`${BASE}/users/${id}`);
  }

  changeRole(id: string, newRole: string) {
    return this.http.patch(`${BASE}/users/${id}/role`, null, {
      params: { newRole },
    });
  }
}
