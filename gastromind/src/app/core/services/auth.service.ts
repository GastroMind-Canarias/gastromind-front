import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { LoginRequest, LoginResponse, UserProfile } from '../models/auth.models';
import { setAuth, setCurrentUser, clearAuth } from '../store/auth.store';

// Ruta relativa → el proxy de Angular dev-server la redirige al backend real.
// En producción configurar el reverse-proxy del servidor web de la misma forma.
const BASE_URL = '/api/v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  /**
   * Login de dos pasos:
   *  1. POST /auth/login   → obtiene el token (sin Authorization).
   *  2. GET  /users/me     → verifica perfil y rol.
   *
   * NOTA: en el paso 2 el token todavía no está en el store (setAuth se llama
   * después de validar el rol), por lo que el interceptor no lo añade
   * automáticamente. Lo inyectamos manualmente como header Authorization aquí.
   * El interceptor lo omite porque la request ya lleva el header.
   */
  login(credentials: LoginRequest): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>(`${BASE_URL}/auth/login`, credentials)
      .pipe(
        switchMap((res) =>
          this.http
            .get<UserProfile>(`${BASE_URL}/users/me`, {
              headers: new HttpHeaders({
                Authorization: `Bearer ${res.token}`,
              }),
            })
            .pipe(
              tap((user) => {
                if (user.role !== 'ROLE_ADMIN') {
                  throw new Error('FORBIDDEN');
                }
                setAuth(res.token, user);
                this.router.navigate(['/dashboard']);
              })
            )
        )
      );
  }

  /**
   * Hidrata el perfil del usuario tras un refresco de página.
   * En ese momento el token ya está en el store (leído de localStorage),
   * así que el interceptor añade Authorization: Bearer automáticamente.
   */
  loadCurrentUser(): Observable<UserProfile> {
    return this.http
      .get<UserProfile>(`${BASE_URL}/users/me`)
      .pipe(tap((user) => setCurrentUser(user)));
  }

  logout(): void {
    clearAuth();
    this.router.navigate(['/login']);
  }
}
