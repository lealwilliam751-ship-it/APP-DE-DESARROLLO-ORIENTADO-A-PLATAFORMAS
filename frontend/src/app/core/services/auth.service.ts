import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginDTO, RegisterDTO, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor(private http: HttpClient) {}

  login(credentials: LoginDTO): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.setSession(res);
      })
    );
  }

  register(data: RegisterDTO): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((res) => {
        this.setSession(res);
      })
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        localStorage.setItem('ecopuntos_user', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('ecopuntos_token');
    localStorage.removeItem('ecopuntos_user');
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('ecopuntos_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user ? user.role === role : false;
  }

  private setSession(authRes: AuthResponse): void {
    localStorage.setItem('ecopuntos_token', authRes.token);
    localStorage.setItem('ecopuntos_user', JSON.stringify(authRes.user));
    this.currentUser.set(authRes.user);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('ecopuntos_user');
    return userJson ? JSON.parse(userJson) : null;
  }
}
