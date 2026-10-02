import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <a routerLink="/" class="logo">
          <span class="leaf-icon">🌱</span> EcoPuntos <span class="badge-city">Pamplona</span>
        </a>
      </div>

      <div class="navbar-menu" *ngIf="authService.isLoggedIn(); else publicNav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">🏠 Inicio</a>
        <a routerLink="/ecopoints" routerLinkActive="active" class="nav-item">📍 Ecopuntos</a>
        <a routerLink="/deliveries" routerLinkActive="active" class="nav-item">📦 Entregas</a>
        <a routerLink="/rewards" routerLinkActive="active" class="nav-item">🎁 Premios</a>
        <a routerLink="/ranking" routerLinkActive="active" class="nav-item">🏆 Ranking</a>

        <div class="user-badge" *ngIf="authService.currentUser() as user">
          <span class="user-name">{{ user.name }}</span>
          <span class="user-role">{{ user.role }}</span>
          <span class="user-points">⭐ {{ user.total_points }} pts</span>
          <button class="btn-logout" (click)="logout()">Cerrar Sesión</button>
        </div>
      </div>

      <ng-template #publicNav>
        <div class="navbar-menu">
          <a routerLink="/login" class="btn-login">Iniciar Sesión</a>
          <a routerLink="/register" class="btn-register">Registrarse</a>
        </div>
      </ng-template>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
      padding: 12px 24px;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: system-ui, -apple-system, sans-serif;
    }

    .logo {
      font-size: 1.4rem;
      font-weight: 700;
      color: white;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge-city {
      background-color: #52b788;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .navbar-menu {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-item {
      color: #d8f3dc;
      text-decoration: none;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .nav-item:hover, .nav-item.active {
      background-color: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .user-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background-color: rgba(0, 0, 0, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .user-name {
      font-weight: 600;
    }

    .user-role {
      background: #74c69d;
      color: #1b4332;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .user-points {
      color: #ffb703;
      font-weight: 700;
    }

    .btn-logout {
      background: #e63946;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }

    .btn-logout:hover {
      background: #c1121f;
    }

    .btn-login {
      color: white;
      text-decoration: none;
      font-weight: 600;
      padding: 6px 14px;
    }

    .btn-register {
      background-color: #52b788;
      color: #1b4332;
      text-decoration: none;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .btn-register:hover {
      background-color: #74c69d;
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
