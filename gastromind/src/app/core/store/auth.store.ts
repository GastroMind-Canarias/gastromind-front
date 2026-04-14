import { signal, computed } from '@angular/core';
import { UserProfile } from '../models/auth.models';

// ── Señales privadas ──────────────────────────────────────────────────────────
const _token = signal<string | null>(localStorage.getItem('authToken'));
const _currentUser = signal<UserProfile | null>(null);

// ── Señales públicas (solo lectura) ───────────────────────────────────────────
export const authToken = _token.asReadonly();
export const currentUser = _currentUser.asReadonly();
export const isAuthenticated = computed(() => !!_token());

// ── Acciones ──────────────────────────────────────────────────────────────────
export function setAuth(token: string, user: UserProfile): void {
  _token.set(token);
  _currentUser.set(user);
  localStorage.setItem('authToken', token);
}

export function clearAuth(): void {
  _token.set(null);
  _currentUser.set(null);
  localStorage.removeItem('authToken');
}
