import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" [class.scrolled]="isScrolled()">
      <div class="nav-inner">
        <!-- Brand -->
        <a routerLink="/" class="brand" (click)="closeMobileMenu()">
          <div class="brand-badge">
            <img src="assets/logo-icon.png" alt="EcoPuntos" class="brand-logo">
          </div>
          <div class="brand-text">
            <span class="brand-name">EcoPuntos</span>
            <span class="brand-city">Pamplona</span>
          </div>
        </a>

        <!-- Desktop Menu Links -->
        <div class="nav-links desktop-only" *ngIf="authService.isLoggedIn(); else publicDesktopLinks">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <i class="bi bi-house-door-fill"></i> Inicio
          </a>

          <ng-container *ngIf="isCiudadano()">
            <a routerLink="/ecopoints" routerLinkActive="active" class="nav-link">
              <i class="bi bi-geo-alt-fill"></i> Ecopuntos
            </a>
            <a routerLink="/deliveries" routerLinkActive="active" class="nav-link">
              <i class="bi bi-box-seam-fill"></i> Entregas
            </a>
            <a routerLink="/rewards" routerLinkActive="active" class="nav-link">
              <i class="bi bi-gift-fill"></i> Premios
            </a>
            <a routerLink="/ranking" routerLinkActive="active" class="nav-link">
              <i class="bi bi-trophy-fill"></i> Ranking
            </a>
            <a routerLink="/ciudadano/qr" routerLinkActive="active" class="nav-link qr-btn">
              <i class="bi bi-qr-code-scan"></i> Mi QR
            </a>
          </ng-container>

          <ng-container *ngIf="isGestor()">
            <a routerLink="/gestor/scan" routerLinkActive="active" class="nav-link qr-btn">
              <i class="bi bi-qr-code-scan"></i> Escanear QR
            </a>
            <a routerLink="/deliveries" routerLinkActive="active" class="nav-link">
              <i class="bi bi-box-seam-fill"></i> Entregas
            </a>
            <a routerLink="/ecopoints" routerLinkActive="active" class="nav-link">
              <i class="bi bi-geo-alt-fill"></i> Ecopuntos
            </a>
          </ng-container>

          <ng-container *ngIf="isAdmin()">
            <a routerLink="/admin/metrics" routerLinkActive="active" class="nav-link">
              <i class="bi bi-bar-chart-line-fill"></i> Métricas
            </a>
            <a routerLink="/admin/ecopoints" routerLinkActive="active" class="nav-link">
              <i class="bi bi-geo-alt-fill"></i> Puntos
            </a>
            <a routerLink="/admin/materials" routerLinkActive="active" class="nav-link">
              <i class="bi bi-recycle"></i> Materiales
            </a>
            <a routerLink="/admin/rewards" routerLinkActive="active" class="nav-link">
              <i class="bi bi-gift-fill"></i> Premios
            </a>
            <a routerLink="/admin/gestores" routerLinkActive="active" class="nav-link">
              <i class="bi bi-person-badge-fill"></i> Gestores
            </a>
          </ng-container>

          <!-- Desktop User Pill -->
          <div class="user-pill" *ngIf="authService.currentUser() as user">
            <div class="user-avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
            <div class="user-info">
              <span class="user-name">{{ user.name.split(' ')[0] }}</span>
              <span class="user-role-pill" [ngClass]="roleClass(user.role)">{{ formatRole(user.role) }}</span>
            </div>
            <span class="user-pts" *ngIf="isCiudadano()"><i class="bi bi-star-fill text-warning"></i> {{ user.total_points }}</span>
            <button class="logout-btn" (click)="logout()" title="Cerrar sesión"><i class="bi bi-power"></i></button>
          </div>
        </div>

        <ng-template #publicDesktopLinks>
          <div class="nav-links desktop-only">
            <a routerLink="/ecopoints" routerLinkActive="active" class="nav-link">
              <i class="bi bi-geo-alt-fill"></i> EcoPuntos
            </a>
            <a routerLink="/rewards" routerLinkActive="active" class="nav-link">
              <i class="bi bi-gift-fill"></i> Premios
            </a>
            <a routerLink="/ranking" routerLinkActive="active" class="nav-link">
              <i class="bi bi-trophy-fill"></i> Ranking
            </a>
            <a routerLink="/login" routerLinkActive="active" class="nav-link">Iniciar Sesión</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Registrarse</a>
          </div>
        </ng-template>

        <!-- Mobile Hamburger Button -->
        <button class="mobile-toggle" (click)="toggleMobileMenu()" aria-label="Abrir menú">
          <span class="hamburger-icon" [class.open]="mobileMenuOpen()"></span>
        </button>
      </div>
    </nav>

    <!-- Mobile Drawer Overlay & Drawer -->
    <div class="mobile-overlay" [class.active]="mobileMenuOpen()" (click)="closeMobileMenu()"></div>
    
    <div class="mobile-drawer" [class.open]="mobileMenuOpen()">
      <div class="drawer-header">
        <div class="brand">
          <div class="brand-badge">
            <img src="assets/logo-icon.png" alt="EcoPuntos" class="brand-logo">
          </div>
          <div class="brand-text">
            <span class="brand-name">EcoPuntos</span>
            <span class="brand-city">Pamplona</span>
          </div>
        </div>
        <button class="drawer-close" (click)="closeMobileMenu()"><i class="bi bi-x-lg"></i></button>
      </div>

      <!-- Mobile User Header -->
      <div class="mobile-user-card" *ngIf="authService.currentUser() as user">
        <div class="muc-avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
        <div class="muc-details">
          <span class="muc-name">{{ user.name }}</span>
          <span class="muc-role" [ngClass]="roleClass(user.role)">{{ formatRole(user.role) }}</span>
        </div>
        <div class="muc-pts" *ngIf="isCiudadano()">
           <i class="bi bi-star-fill text-warning"></i> <span>{{ user.total_points }}</span> pts
        </div>
      </div>

      <!-- Mobile Links -->
      <div class="mobile-menu-items" *ngIf="authService.isLoggedIn(); else publicMobileLinks">
        <a routerLink="/dashboard" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
          <i class="bi bi-house-door-fill m-icon"></i> Panel de Inicio
        </a>

        <ng-container *ngIf="isCiudadano()">
          <a routerLink="/ecopoints" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-geo-alt-fill m-icon"></i> Puntos de Reciclaje
          </a>
          <a routerLink="/deliveries" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-box-seam-fill m-icon"></i> Mis Entregas
          </a>
          <a routerLink="/rewards" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-gift-fill m-icon"></i> Catálogo de Premios
          </a>
          <a routerLink="/ranking" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-trophy-fill m-icon"></i> Ranking Ecológico
          </a>
          <a routerLink="/ciudadano/qr" routerLinkActive="m-active" class="m-link highlight" (click)="closeMobileMenu()">
            <i class="bi bi-qr-code-scan m-icon"></i> Mi Código QR
          </a>
        </ng-container>

        <ng-container *ngIf="isGestor()">
          <a routerLink="/gestor/scan" routerLinkActive="m-active" class="m-link highlight" (click)="closeMobileMenu()">
            <i class="bi bi-qr-code-scan m-icon"></i> Escanear QR Ciudadano
          </a>
          <a routerLink="/deliveries" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-box-seam-fill m-icon"></i> Aprobar Entregas
          </a>
          <a routerLink="/ecopoints" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-geo-alt-fill m-icon"></i> Ecopuntos
          </a>
        </ng-container>

        <ng-container *ngIf="isAdmin()">
          <a routerLink="/admin/metrics" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-bar-chart-line-fill m-icon"></i> Panel de Métricas
          </a>
          <a routerLink="/admin/ecopoints" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-geo-alt-fill m-icon"></i> Gestionar Puntos
          </a>
          <a routerLink="/admin/materials" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-recycle m-icon"></i> Gestionar Materiales
          </a>
          <a routerLink="/admin/rewards" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-gift-fill m-icon"></i> Gestionar Premios
          </a>
          <a routerLink="/admin/gestores" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-person-badge-fill m-icon"></i> Gestionar Gestores
          </a>
        </ng-container>

        <div class="m-divider"></div>
        <button class="m-logout-btn" (click)="logoutMobile()">
          <i class="bi bi-power"></i> Cerrar Sesión
        </button>
      </div>

      <ng-template #publicMobileLinks>
        <div class="mobile-menu-items">
          <a routerLink="/ecopoints" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-geo-alt-fill m-icon"></i> EcoPuntos (Pamplona)
          </a>
          <a routerLink="/rewards" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-gift-fill m-icon"></i> Catálogo de Premios
          </a>
          <a routerLink="/ranking" routerLinkActive="m-active" class="m-link" (click)="closeMobileMenu()">
            <i class="bi bi-trophy-fill m-icon"></i> Ranking Ecológico
          </a>
          <div class="m-divider"></div>
          <a routerLink="/login" class="btn btn-secondary btn-full mb-3" (click)="closeMobileMenu()">
             <i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión
          </a>
          <a routerLink="/register" class="btn btn-primary btn-full" (click)="closeMobileMenu()">
             <i class="bi bi-person-plus-fill"></i> Crear Cuenta Gratis
          </a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: linear-gradient(135deg, #0a2e1a 0%, #1b4332 60%, #2d6a4f 100%);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      transition: box-shadow 0.3s;
    }
    .navbar.scrolled {
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
    }
    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      flex-shrink: 0;
    }
    .brand-badge {
      width: 40px;
      height: 40px;
      background: #ffffff;
      border-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
      flex-shrink: 0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .brand:hover .brand-badge {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.38);
    }
    .brand-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
    .brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.3px;
    }
    .brand-city {
      font-size: 0.62rem;
      font-weight: 700;
      color: #74c69d;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    /* Desktop Menu */
    .nav-links {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 8px;
      color: rgba(255,255,255,0.8);
      font-size: 0.88rem;
      font-weight: 500;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.18s ease;
    }
    .nav-link .nav-icon { font-size: 0.95rem; }
    .nav-link:hover, .nav-link.active {
      background: rgba(255,255,255,0.15);
      color: #ffffff;
    }
    .nav-link.qr-btn {
      background: rgba(82,183,136,0.25);
      color: #95d5b2;
      font-weight: 700;
    }
    .nav-link.qr-btn:hover { background: rgba(82,183,136,0.4); color: #ffffff; }

    /* Desktop User Pill */
    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.14);
      padding: 4px 10px 4px 6px;
      border-radius: 40px;
      margin-left: 10px;
    }
    .user-avatar {
      width: 30px; height: 30px;
      background: linear-gradient(135deg, #52b788, #2d6a4f);
      color: white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
      flex-shrink: 0;
    }
    .user-info { display: flex; flex-direction: column; gap: 1px; }
    .user-name { font-size: 0.82rem; font-weight: 600; color: white; line-height: 1; }
    .user-role-pill {
      font-size: 0.6rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .role-ciudadano { background: #d8f3dc; color: #1b4332; }
    .role-gestor    { background: #e0f2fe; color: #0369a1; }
    .role-admin     { background: #fef9c3; color: #92400e; }
    .user-pts { font-size: 0.78rem; font-weight: 700; color: #ffb703; white-space: nowrap; }
    .logout-btn {
      background: rgba(230,57,70,0.2);
      color: #ff6b7a;
      border: none;
      width: 28px; height: 28px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .logout-btn:hover { background: rgba(230,57,70,0.45); color: white; }

    /* Mobile Hamburger Icon */
    .mobile-toggle {
      display: none;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      width: 42px; height: 42px;
      border-radius: 10px;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .hamburger-icon {
      position: relative;
      width: 20px; height: 2px;
      background: white;
      transition: background 0.2s;
    }
    .hamburger-icon::before, .hamburger-icon::after {
      content: '';
      position: absolute;
      left: 0; width: 100%; height: 2px;
      background: white;
      transition: transform 0.25s ease;
    }
    .hamburger-icon::before { top: -6px; }
    .hamburger-icon::after  { top: 6px; }
    .hamburger-icon.open { background: transparent; }
    .hamburger-icon.open::before { transform: translateY(6px) rotate(45deg); }
    .hamburger-icon.open::after  { transform: translateY(-6px) rotate(-45deg); }

    /* Mobile Overlay */
    .mobile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10,46,26,0.6);
      backdrop-filter: blur(4px);
      z-index: 1050;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .mobile-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    /* Mobile Drawer */
    .mobile-drawer {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: 300px;
      max-width: 85vw;
      background: #0f3d24;
      z-index: 1100;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      padding: 20px;
      box-shadow: -8px 0 32px rgba(0,0,0,0.4);
      overflow-y: auto;
    }
    .mobile-drawer.open {
      transform: translateX(0);
    }
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      margin-bottom: 16px;
    }
    .drawer-close {
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      width: 34px; height: 34px;
      border-radius: 8px;
      font-size: 1.1rem;
      cursor: pointer;
    }

    /* Mobile User Card */
    .mobile-user-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      padding: 12px 14px;
      border-radius: 14px;
      margin-bottom: 20px;
    }
    .muc-avatar {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #52b788, #2d6a4f);
      color: white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.1rem;
    }
    .muc-details { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .muc-name { font-size: 0.95rem; font-weight: 700; color: white; }
    .muc-role {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      align-self: flex-start;
      text-transform: uppercase;
    }
    .muc-pts { font-size: 0.85rem; font-weight: 700; color: #ffb703; }

    /* Mobile Menu Items */
    .mobile-menu-items {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }
    .m-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      color: rgba(255,255,255,0.85);
      font-weight: 500;
      font-size: 0.95rem;
      text-decoration: none;
      transition: background 0.2s;
    }
    .m-link .m-icon { font-size: 1.2rem; }
    .m-link:hover, .m-link.m-active {
      background: rgba(255,255,255,0.15);
      color: white;
    }
    .m-link.highlight {
      background: rgba(82,183,136,0.2);
      color: #95d5b2;
      font-weight: 700;
    }
    .m-divider {
      height: 1px;
      background: rgba(255,255,255,0.1);
      margin: 12px 0;
    }
    .m-logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px;
      background: rgba(230,57,70,0.2);
      color: #ff6b7a;
      border: 1px solid rgba(230,57,70,0.3);
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
    }

    .btn-full { width: 100%; justify-content: center; padding: 12px; }
    .mb-3 { margin-bottom: 12px; }
    .btn-secondary { background: rgba(255,255,255,0.15); color: white; border: none; }

    /* Responsive Breakpoints */
    @media (max-width: 900px) {
      .desktop-only { display: none !important; }
      .mobile-toggle { display: flex; }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  isScrolled = signal(false);
  mobileMenuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 10);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logoutMobile(): void {
    this.closeMobileMenu();
    this.logout();
  }

  isCiudadano(): boolean {
    return this.authService.currentUser()?.role === 'Ciudadano';
  }
  isGestor(): boolean {
    return this.authService.currentUser()?.role === 'Gestor_de_Punto';
  }
  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'Administrador';
  }
  formatRole(role: string): string {
    if (role === 'Gestor_de_Punto') return 'Gestor';
    if (role === 'Administrador') return 'Admin';
    return role;
  }
  roleClass(role: string): string {
    if (role === 'Gestor_de_Punto') return 'role-gestor';
    if (role === 'Administrador') return 'role-admin';
    return 'role-ciudadano';
  }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
