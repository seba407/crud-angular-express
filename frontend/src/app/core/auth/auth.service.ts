import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_URL } from '../api/api.config';

export interface User {
  username: string;
  name: string;
}

interface Session {
  token: string;
  user: User;
}

interface LoginResponse {
  token: string;
  user: User;
}

const STORAGE_KEY = 'crud.session';

/** Autenticación contra el backend (POST /api/auth/login → JWT). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<Session | null>(this.readSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  login(username: string, password: string): Observable<User> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, { username, password }).pipe(
      tap((res) => this.saveSession({ token: res.token, user: res.user })),
      map((res) => res.user),
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  private saveSession(session: Session): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }

  /** Lee la sesión guardada; la descarta si no tiene token o si el token ya expiró. */
  private readSession(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Partial<Session>;
      if (typeof session.token !== 'string' || !session.user || isExpired(session.token)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session as Session;
    } catch {
      return null;
    }
  }
}

/** Revisa el `exp` del JWT (solo para UX; la validación real la hace el backend). */
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
