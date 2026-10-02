import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../app/core/services/auth.service';
import { DeliveryService } from '../../../app/core/services/delivery.service';
import { Delivery } from '../../../app/core/models/delivery.model';
import { User } from '../../../app/core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container" *ngIf="user">
      <div class="welcome-header">
        <div class="header-text">
          <h1>¡Hola, {{ user.name }}! 👋</h1>
          <p>Bienvenido al panel principal de <strong>EcoPuntos Pamplona</strong></p>
        </div>
        <div class="role-badge-large" [ngClass]="user.role.toLowerCase()">
          {{ user.role }}
        </div>
      </div>

      <!-- Métricas del Ciudadano -->
      <div class="stats-grid" *ngIf="user.role === 'Ciudadano'">
        <div class="stat-card points">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">{{ user.total_points }}</div>
          <div class="stat-label">Puntos Acumulados</div>
        </div>

        <div class="stat-card level">
          <div class="stat-icon">🌱</div>
          <div class="stat-value">{{ user.level }}</div>
          <div class="stat-label">Nivel Ecológico</div>
        </div>

        <div class="stat-card city">
          <div class="stat-icon">🏙️</div>
          <div class="stat-value">{{ user.default_city }}</div>
          <div class="stat-label">Ciudad de Registro</div>
        </div>
      </div>

      <!-- Panel de Acciones Rápida -->
      <div class="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div class="action-buttons">
          <a routerLink="/deliveries" class="btn-action primary">
            ➕ Registrar Nueva Entrega
          </a>
          <a routerLink="/ecopoints" class="btn-action secondary">
            📍 Ver Ecopuntos Cercanos
          </a>
          <a routerLink="/rewards" class="btn-action accent">
            🎁 Canjear Recompensas
          </a>
          <a routerLink="/ranking" class="btn-action warning">
            🏆 Ver Tabla de Clasificación
          </a>
        </div>
      </div>

      <!-- Mis Entregas Recientes (Ciudadano) -->
      <div class="recent-section" *ngIf="user.role === 'Ciudadano'">
        <h3>📦 Mis Entregas Recientes</h3>
        <div *ngIf="deliveries.length === 0" class="empty-state">
          No has realizado entregas de reciclaje aún. ¡Realiza tu primera entrega y empieza a ganar EcoPuntos!
        </div>
        <table *ngIf="deliveries.length > 0" class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ecopunto</th>
              <th>Puntos</th>
              <th>CO₂ Ahorrado</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of deliveries">
              <td>#{{ d.id }}</td>
              <td>{{ d.ecopoint_name || 'Ecopunto Pamplona' }}</td>
              <td>+{{ d.total_points }} pts</td>
              <td>{{ d.total_co2 }} kg</td>
              <td>
                <span class="status-pill" [ngClass]="d.status">
                  {{ d.status === 'approved' ? 'Aprobada' : (d.status === 'pending' ? 'Pendiente' : 'Rechazada') }}
                </span>
              </td>
              <td>{{ d.created_at | date:'shortDate' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Panel de Control para Gestor de Punto -->
      <div class="recent-section" *ngIf="user.role === 'Gestor_de_Punto' || user.role === 'Administrador'">
        <h3>📋 Entregas Pendientes por Aprobar</h3>
        <div *ngIf="pendingDeliveries.length === 0" class="empty-state">
          No hay entregas pendientes de validación en este momento.
        </div>
        <table *ngIf="pendingDeliveries.length > 0" class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Puntos Est.</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pendingDeliveries">
              <td>#{{ p.id }}</td>
              <td>{{ p.user_name || 'Usuario #' + p.user_id }}</td>
              <td>{{ p.total_points }} pts</td>
              <td class="actions-cell">
                <button class="btn-approve" (click)="approveDelivery(p.id)">Aprobar</button>
                <button class="btn-reject" (click)="rejectDelivery(p.id)">Rechazar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1080px;
      margin: 24px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .welcome-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }

    .welcome-header h1 {
      margin: 0;
      color: #1b4332;
      font-size: 1.8rem;
    }

    .welcome-header p {
      margin: 4px 0 0 0;
      color: #64748b;
    }

    .role-badge-large {
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.9rem;
      text-transform: uppercase;
    }

    .role-badge-large.ciudadano { background: #d8f3dc; color: #1b4332; }
    .role-badge-large.gestor_de_punto { background: #e0f2fe; color: #0369a1; }
    .role-badge-large.administrador { background: #fef3c7; color: #92400e; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-icon { font-size: 2rem; margin-bottom: 8px; }
    .stat-value { font-size: 1.8rem; font-weight: 800; color: #1b4332; }
    .stat-label { color: #64748b; font-size: 0.85rem; margin-top: 4px; }

    .quick-actions {
      background: white;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }

    .quick-actions h3 { margin-top: 0; color: #1b4332; }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .btn-action {
      padding: 12px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      transition: transform 0.15s, opacity 0.15s;
    }

    .btn-action:hover { transform: translateY(-2px); }
    .btn-action.primary { background: #2d6a4f; color: white; }
    .btn-action.secondary { background: #52b788; color: #1b4332; }
    .btn-action.accent { background: #ffb703; color: #000; }
    .btn-action.warning { background: #e76f51; color: white; }

    .recent-section {
      background: white;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .recent-section h3 { margin-top: 0; color: #1b4332; }

    .empty-state {
      padding: 24px;
      text-align: center;
      color: #64748b;
      background: #f8fafc;
      border-radius: 8px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }

    .data-table th, .data-table td {
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
    }

    .data-table th { background: #f8fafc; color: #475569; font-size: 0.85rem; }

    .status-pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .status-pill.approved { background: #dcfce7; color: #15803d; }
    .status-pill.pending { background: #fef9c3; color: #a16207; }
    .status-pill.rejected { background: #fee2e2; color: #b91c1c; }

    .actions-cell { display: flex; gap: 8px; }
    .btn-approve { background: #16a34a; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
    .btn-reject { background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private deliveryService = inject(DeliveryService);

  user: User | null = null;
  deliveries: Delivery[] = [];
  pendingDeliveries: Delivery[] = [];

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
      next: (res) => this.deliveries = res,
      error: () => this.deliveries = []
    });
  }

  loadPendingDeliveries(): void {
    this.deliveryService.getPendingDeliveries().subscribe({
      next: (res) => this.pendingDeliveries = res,
      error: () => this.pendingDeliveries = []
    });
  }

  approveDelivery(id: number): void {
    this.deliveryService.approve(id).subscribe({
      next: () => this.loadPendingDeliveries()
    });
  }

  rejectDelivery(id: number): void {
    this.deliveryService.reject(id).subscribe({
      next: () => this.loadPendingDeliveries()
    });
  }
}
