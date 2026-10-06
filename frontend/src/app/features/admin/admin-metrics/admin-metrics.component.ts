import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminMetrics } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metrics-container">
      <div class="header">
        <h1>📊 Panel de Métricas de Administración</h1>
        <p class="subtitle">Resumen global del impacto ambiental y participación comunitaria en Pamplona</p>
      </div>

      <div *ngIf="loading" class="loading-spinner">
        <div class="spinner"></div>
        <p>Cargando métricas del sistema...</p>
      </div>

      <div *ngIf="errorMessage" class="alert error">
        <span>⚠️ {{ errorMessage }}</span>
        <button (click)="loadMetrics()">Reintentar</button>
      </div>

      <div *ngIf="!loading && !errorMessage && metrics" class="metrics-grid">
        <div class="metric-card users">
          <div class="icon">👥</div>
          <div class="metric-info">
            <span class="label">Usuarios Registrados</span>
            <span class="value">{{ metrics.totalUsers | number }}</span>
          </div>
        </div>

        <div class="metric-card deliveries">
          <div class="icon">📦</div>
          <div class="metric-info">
            <span class="label">Entregas Aprobadas</span>
            <span class="value">{{ metrics.totalDeliveries | number }}</span>
          </div>
        </div>

        <div class="metric-card points">
          <div class="icon">⭐</div>
          <div class="metric-info">
            <span class="label">Puntos Entregados</span>
            <span class="value">{{ metrics.totalPoints | number }} pts</span>
          </div>
        </div>

        <div class="metric-card co2">
          <div class="icon">🌱</div>
          <div class="metric-info">
            <span class="label">CO₂ Evitado Totales</span>
            <span class="value">{{ metrics.totalCo2 | number:'1.2-2' }} kg</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics-container {
      max-width: 1000px;
      margin: 30px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .header h1 {
      color: #1b4332;
      font-size: 1.8rem;
      margin-bottom: 6px;
    }
    .subtitle {
      color: #555;
      font-size: 0.95rem;
      margin-bottom: 24px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }
    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 18px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border-left: 6px solid #2d6a4f;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    }
    .metric-card.users { border-left-color: #3a86ff; }
    .metric-card.deliveries { border-left-color: #fb5607; }
    .metric-card.points { border-left-color: #ff006e; }
    .metric-card.co2 { border-left-color: #38b000; }
    .icon {
      font-size: 2.4rem;
    }
    .metric-info {
      display: flex;
      flex-direction: column;
    }
    .label {
      font-size: 0.85rem;
      color: #666;
      font-weight: 500;
    }
    .value {
      font-size: 1.6rem;
      font-weight: 700;
      color: #1b4332;
    }
    .loading-spinner {
      text-align: center;
      padding: 40px;
      color: #2d6a4f;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #d8f3dc;
      border-top-color: #2d6a4f;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .alert.error {
      background-color: #ffddd2;
      color: #c1121f;
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .alert button {
      background: #c1121f;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class AdminMetricsComponent implements OnInit {
  private adminService = inject(AdminService);
  metrics: AdminMetrics | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminService.getMetrics().subscribe({
      next: (res) => {
        this.metrics = res;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Error al obtener métricas del sistema.';
        this.loading = false;
      }
    });
  }
}
