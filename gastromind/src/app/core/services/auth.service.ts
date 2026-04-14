import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, switchMap, tap, throwError } from 'rxjs';
import { LoginRequest, LoginResponse, UserProfile } from '../models/auth.models';
import { setAuth, clearAuth } from '../store/auth.store';

const BASE_URL = 'http://100.97.191.102:8081/api/v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  login(credentials: LoginRequest): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>(`${BASE_URL}/auth/login`, credentials)
      .pipe(
        switchMap((res) => {
          const headers = new HttpHeaders({ Authorization: `Bearer ${res.token}` });
          return this.http.get<UserProfile>(`${BASE_URL}/users/me`, { headers }).pipe(
            tap((user) => {
              if (user.role !== 'ROLE_ADMIN') {
                throw new Error('FORBIDDEN');
              }
              setAuth(res.token, user);
              this.router.navigate(['/dashboard']);
            })
          );
        })
      );
  }

  logout(): void {
    clearAuth();
    this.router.navigate(['/login']);
  }
}
