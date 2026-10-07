import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { Delivery } from '../../core/models/delivery.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container fade-in">

      <!-- Welcome header -->
      <div class="welcome-banner" *ngIf="user">
        <div class="wb-left">
          <div class="wb-avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
          <div>
            <h2 class="wb-title">¡Hola, {{ user.name.split(' ')[0] }}! 👋</h2>
            <p class="wb-sub">Bienvenido al panel de <strong>EcoPuntos Pamplona</strong></p>
          </div>
        </div>
        <span class="role-badge" [ngClass]="'role-' + user.role.toLowerCase()">
          {{ formatRole(user.role) }}
        </span>
      </div>

      <!-- Loading -->
      <div class="spinner" *ngIf="!user"></div>

      <ng-container *ngIf="user">

        <!-- Ciudadano stats -->
        <div class="grid-3 mb-6" *ngIf="user.role === 'Ciudadano'">
          <div class="stat-card green">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">{{ user.total_points | number }}</div>
            <div class="stat-label">Puntos acumulados</div>
            <div class="stat-bar"><div class="stat-bar-fill" [style.width]="levelPct() + '%'"></div></div>
          </div>
          <div class="stat-card yellow">
            <div class="stat-icon">🌱</div>
            <div class="stat-value">{{ user.level || 'Semilla Verde' }}</div>
            <div class="stat-label">Nivel ecológico actual</div>
          </div>
          <div class="stat-card blue">
            <div class="stat-icon">📦</div>
            <div class="stat-value">{{ deliveries().length }}</div>
            <div class="stat-label">Entregas de reciclaje</div>
          </div>
        </div>

        <!-- Gestor stats -->
        <div class="grid-3 mb-6" *ngIf="user.role === 'Gestor_de_Punto'">
          <div class="stat-card yellow">
            <div class="stat-icon">⏳</div>
            <div class="stat-value">{{ pendingDeliveries().length }}</div>
            <div class="stat-label">Entregas por aprobar</div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">📱</div>
            <div class="stat-value">Escanear</div>
            <div class="stat-label">Validar carnet QR de ciudadano</div>
          </div>
        </div>

        <!-- Admin stats -->
        <div class="grid-3 mb-6" *ngIf="user.role === 'Administrador'">
          <div class="stat-card yellow">
            <div class="stat-icon">⏳</div>
            <div class="stat-value">{{ pendingDeliveries().length }}</div>
            <div class="stat-label">Entregas pendientes</div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">📊</div>
            <div class="stat-value">Métricas</div>
            <div class="stat-label">Impacto ambiental global</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon">⚙️</div>
            <div class="stat-value">Gestión</div>
            <div class="stat-label">Configurar catálogo y puntos</div>
          </div>
        </div>

        <!-- Acciones rápidas -->
        <div class="card mb-6">
          <h3 class="section-title">⚡ Acciones rápidas</h3>
          <div class="quick-grid">
            <ng-container *ngIf="user.role === 'Ciudadano'">
              <a routerLink="/deliveries" class="quick-card primary">
                <span class="qc-icon">📦</span>
                <div class="qc-body">
                  <strong>Registrar Entrega</strong>
                  <small>Sumar EcoPuntos</small>
                </div>
              </a>
              <a routerLink="/ecopoints" class="quick-card teal">
                <span class="qc-icon">📍</span>
                <div class="qc-body">
                  <strong>EcoPuntos</strong>
                  <small>Ver mapa de acopio</small>
                </div>
              </a>
              <a routerLink="/rewards" class="quick-card yellow">
                <span class="qc-icon">🎁</span>
                <div class="qc-body">
                  <strong>Premios</strong>
                  <small>Canjear puntos</small>
                </div>
              </a>
              <a routerLink="/ciudadano/qr" class="quick-card orange">
                <span class="qc-icon">🪪</span>
                <div class="qc-body">
                  <strong>Mi Carnet QR</strong>
                  <small>Presentar en estación</small>
                </div>
              </a>
            </ng-container>

            <ng-container *ngIf="user.role === 'Gestor_de_Punto'">
              <a routerLink="/gestor/scan" class="quick-card primary">
                <span class="qc-icon">📱</span>
                <div class="qc-body">
                  <strong>Escanear QR</strong>
                  <small>Validar ciudadano</small>
                </div>
              </a>
              <a routerLink="/deliveries" class="quick-card yellow">
                <span class="qc-icon">📋</span>
                <div class="qc-body">
                  <strong>Aprobar Entregas</strong>
                  <small>{{ pendingDeliveries().length }} pendientes</small>
                </div>
              </a>
            </ng-container>

            <ng-container *ngIf="user.role === 'Administrador'">
              <a routerLink="/admin/metrics" class="quick-card primary">
                <span class="qc-icon">📊</span>
                <div class="qc-body">
                  <strong>Métricas</strong>
                  <small>Reportes de impacto</small>
                </div>
              </a>
              <a routerLink="/admin/ecopoints" class="quick-card teal">
                <span class="qc-icon">📍</span>
                <div class="qc-body">
                  <strong>Gestionar Puntos</strong>
                  <small>Puntos de acopio</small>
                </div>
              </a>
              <a routerLink="/admin/materials" class="quick-card yellow">
                <span class="qc-icon">♻️</span>
                <div class="qc-body">
                  <strong>Materiales</strong>
                  <small>Precios y equivalencias</small>
                </div>
              </a>
              <a routerLink="/admin/gestores" class="quick-card orange">
                <span class="qc-icon">👷</span>
                <div class="qc-body">
                  <strong>Crear Gestor</strong>
                  <small>Administrar personal</small>
                </div>
              </a>
            </ng-container>
          </div>
        </div>

        <!-- Mis entregas recientes (Ciudadano) -->
        <div class="card" *ngIf="user.role === 'Ciudadano'">
          <div class="section-header">
            <h3 class="section-title">📦 Mis Entregas Recientes</h3>
            <a routerLink="/deliveries" class="view-all">Ver todas →</a>
          </div>
          <div class="empty-state" *ngIf="deliveries().length === 0">
            <div class="empty-icon">♻️</div>
            <p>Aún no tienes entregas registradas.</p>
            <a routerLink="/deliveries" class="btn btn-primary btn-sm" style="margin-top:12px">Hacer primera entrega</a>
          </div>
          <div class="table-responsive" *ngIf="deliveries().length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>EcoPunto</th>
                  <th>Puntos</th>
                  <th>CO₂ Ahorrado</th>
                  <th>Estado de Validación</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let d of deliveries().slice(0,6)">
                  <td><span class="id-badge">#{{ d.id }}</span></td>
                  <td>📍 {{ d.ecopoint_name || 'EcoPunto Pamplona' }}</td>
                  <td><strong style="color:#2d6a4f">+{{ d.total_points }} pts</strong></td>
                  <td>🌱 {{ d.total_co2 }} kg</td>
                  <td>
                    <span class="pill" [ngClass]="statusClass(d.status)">
                      {{ statusLabel(d.status) }}
                    </span>
                  </td>
                  <td style="color:#64748b; font-size:0.85rem">{{ d.created_at | date:'dd/MM/yyyy' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Entregas pendientes (Gestor / Admin) -->
        <div class="card" *ngIf="user.role === 'Gestor_de_Punto' || user.role === 'Administrador'">
          <div class="section-header">
            <h3 class="section-title">📋 Entregas Pendientes de Aprobación</h3>
            <span class="badge-count" *ngIf="pendingDeliveries().length > 0">{{ pendingDeliveries().length }}</span>
          </div>
          <div class="empty-state" *ngIf="pendingDeliveries().length === 0">
            <div class="empty-icon">✅</div>
            <p>No hay entregas pendientes en este momento.</p>
          </div>
          <div class="table-responsive" *ngIf="pendingDeliveries().length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Ciudadano</th>
                  <th>Puntos Estimados</th>
                  <th>Fecha</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of pendingDeliveries()">
                  <td><span class="id-badge">#{{ p.id }}</span></td>
                  <td>👤 <strong>{{ p.citizen_name || p.user_name || 'Usuario #' + p.user_id }}</strong></td>
                  <td><strong style="color:#2d6a4f">+{{ p.total_points }} pts</strong></td>
                  <td style="color:#64748b; font-size:0.85rem">{{ p.created_at | date:'dd/MM/yyyy, h:mm a' }}</td>
                  <td style="text-align: right;">
                    <div style="display:inline-flex; gap:6px">
                      <button class="btn btn-sm" style="background:#dcfce7;color:#15803d;border:1px solid #b7e4c7;" (click)="approveDelivery(p.id)">✓ Aprobar</button>
                      <button class="btn btn-sm btn-danger" (click)="rejectDelivery(p.id)">✕ Rechazar</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .mb-6 { margin-bottom: 24px; }

    .welcome-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #1b4332, #2d6a4f);
      color: white;
      padding: 24px 28px;
      border-radius: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .wb-left { display: flex; align-items: center; gap: 16px; }
    .wb-avatar {
      width: 52px; height: 52px;
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.25);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 800; color: white;
    }
    .wb-title { color: white; font-size: 1.4rem; margin-bottom: 2px; }
    .wb-sub { color: rgba(255,255,255,0.7); font-size: 0.88rem; }
    .role-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .role-ciudadano { background: #d8f3dc; color: #1b4332; }
    .role-gestor_de_punto { background: #e0f2fe; color: #0369a1; }
    .role-administrador { background: #fef9c3; color: #92400e; }

    .stat-card {
      background: white;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 22px;
      display: flex; flex-direction: column; gap: 6px;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .stat-icon { font-size: 1.6rem; }
    .stat-value { font-size: 2rem; font-weight: 800; color: #0f172a; }
    .stat-label { font-size: 0.82rem; color: #64748b; font-weight: 500; }
    .stat-bar { height: 4px; background: #f1f5f9; border-radius: 2px; margin-top: 8px; overflow: hidden; }
    .stat-bar-fill { height: 100%; background: linear-gradient(90deg, #52b788, #2d6a4f); border-radius: 2px; transition: width 1s ease; }

    .card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 24px; }
    .section-title { color: #1b4332; font-size: 1.05rem; font-weight: 700; margin: 0; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .view-all { font-size: 0.82rem; color: #2d6a4f; font-weight: 600; text-decoration: none; }
    .view-all:hover { text-decoration: underline; }
    .badge-count { background: #fee2e2; color: #b91c1c; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; }

    .quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .quick-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s;
      border: 1.5px solid transparent;
    }
    .quick-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
    .quick-card.primary { background: #f0faf3; border-color: #b7e4c7; }
    .quick-card.teal    { background: #f0f9ff; border-color: #bae6fd; }
    .quick-card.yellow  { background: #fffbeb; border-color: #fcd34d; }
    .quick-card.orange  { background: #fff7ed; border-color: #fdba74; }
    .quick-card.purple  { background: #faf5ff; border-color: #c4b5fd; }
    .qc-icon { font-size: 1.5rem; flex-shrink: 0; }
    .qc-body { display: flex; flex-direction: column; }
    .qc-body strong { font-size: 0.82rem; font-weight: 700; color: #1e293b; }
    .qc-body small { font-size: 0.72rem; color: #64748b; }

    .id-badge { background: #f1f5f9; color: #475569; padding: 2px 7px; border-radius: 5px; font-size: 0.78rem; font-weight: 600; }
    .pill { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .pill-green  { background: #dcfce7; color: #15803d; border: 1px solid #b7e4c7; }
    .pill-yellow { background: #fef9c3; color: #a16207; border: 1px solid #fde047; }
    .pill-red    { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; font-family: inherit; }
    .btn-primary { background: #2d6a4f; color: white; }
    .btn-sm { padding: 6px 12px; font-size: 0.78rem; }
    .btn-danger { background: #fee2e2; color: #b91c1c; }
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }

    @media (max-width: 600px) {
      .welcome-banner { flex-direction: column; align-items: flex-start; gap: 12px; padding: 18px 20px; }
      .wb-left { width: 100%; }
      .role-badge { align-self: flex-start; }
      .quick-grid { grid-template-columns: 1fr 1fr; }
      .card { padding: 16px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private deliveryService = inject(DeliveryService);
  private cdr = inject(ChangeDetectorRef);

  user: User | null = null;
  deliveries = signal<Delivery[]>([]);
  pendingDeliveries = signal<Delivery[]>([]);

  ngOnInit(): void {
    this.user = this.authService.currentUser();
    if (this.user?.role === 'Ciudadano') {
      this.loadMyDeliveries();
    } else if (this.user?.role === 'Gestor_de_Punto' || this.user?.role === 'Administrador') {
      this.loadPendingDeliveries();
    }
  }

  loadMyDeliveries(): void {
    this.deliveryService.getMyDeliveries().subscribe({
      next: (res: Delivery[]) => {
        this.deliveries.set(res || []);
        this.cdr.detectChanges();
      },
      error: () => {
        this.deliveries.set([]);
        this.cdr.detectChanges();
      }
    });
  }

  loadPendingDeliveries(): void {
    this.deliveryService.getPendingDeliveries().subscribe({
      next: (res: Delivery[]) => {
        this.pendingDeliveries.set(res || []);
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingDeliveries.set([]);
        this.cdr.detectChanges();
      }
    });
  }

  approveDelivery(id: number): void {
    this.deliveryService.approve(id).subscribe({
      next: () => {
        this.loadPendingDeliveries();
        this.authService.getProfile().subscribe(() => this.cdr.detectChanges());
      }
    });
  }

  rejectDelivery(id: number): void {
    this.deliveryService.reject(id).subscribe({
      next: () => this.loadPendingDeliveries()
    });
  }

  levelPct(): number {
    const pts = this.user?.total_points ?? 0;
    return Math.min((pts / 1000) * 100, 100);
  }

  formatRole(role: string): string {
    if (role === 'Gestor_de_Punto') return 'Gestor de Punto';
    if (role === 'Administrador') return 'Administrador';
    return role;
  }

  statusLabel(s: string): string {
    return s === 'approved' ? '✅ Aprobada' : s === 'pending' ? '⏳ Pendiente' : '❌ Rechazada';
  }

  statusClass(s: string): string {
    return s === 'approved' ? 'pill-green' : s === 'pending' ? 'pill-yellow' : 'pill-red';
  }
}
