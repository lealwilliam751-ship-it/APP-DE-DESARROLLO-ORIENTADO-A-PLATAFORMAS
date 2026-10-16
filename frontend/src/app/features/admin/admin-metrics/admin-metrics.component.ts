import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminMetrics } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container fade-in">
      <div class="page-header">
        <div>
          <h2><i class="bi bi-bar-chart-line-fill me-2" style="color:#52b788"></i>Panel de Métricas Globales</h2>
          <p style="color:#64748b; font-size:0.95rem; margin-top:4px">
            Resumen en tiempo real del impacto ambiental y participación comunitaria en Pamplona
          </p>
        </div>
      </div>

      <!-- Loading spinner -->
      <div class="spinner" *ngIf="loading()"></div>

      <!-- Error alert -->
      <div class="alert alert-error" *ngIf="errorMessage()">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <span>{{ errorMessage() }}</span>
        <button class="btn btn-sm btn-danger" style="margin-left:auto" (click)="loadMetrics()">Reintentar</button>
      </div>

      <!-- Metrics grid -->
      <div class="grid-4" *ngIf="!loading() && metrics() as m">

        <div class="stat-card blue">
          <div class="sc-top">
            <span class="sc-label">Usuarios Registrados</span>
            <span class="sc-chip blue"><i class="bi bi-people-fill"></i></span>
          </div>
          <div class="sc-value">{{ m.totalUsers | number }}</div>
          <div class="sc-trend"><i class="bi bi-arrow-up-short"></i> Ciudadanos activos</div>
        </div>

        <div class="stat-card green">
          <div class="sc-top">
            <span class="sc-label">Entregas Aprobadas</span>
            <span class="sc-chip green"><i class="bi bi-box-seam-fill"></i></span>
          </div>
          <div class="sc-value">{{ m.totalDeliveries | number }}</div>
          <div class="sc-trend"><i class="bi bi-recycle"></i> Total reciclado</div>
        </div>

        <div class="stat-card yellow">
          <div class="sc-top">
            <span class="sc-label">Puntos Emitidos</span>
            <span class="sc-chip yellow"><i class="bi bi-star-fill"></i></span>
          </div>
          <div class="sc-value">{{ m.totalPoints | number }}</div>
          <div class="sc-trend"><i class="bi bi-gift-fill"></i> pts acumulados</div>
        </div>

        <div class="stat-card purple">
          <div class="sc-top">
            <span class="sc-label">CO₂ Evitado</span>
            <span class="sc-chip purple"><i class="bi bi-wind"></i></span>
          </div>
          <div class="sc-value">{{ m.totalCo2 | number:'1.1-2' }} <small>kg</small></div>
          <div class="sc-trend"><i class="bi bi-leaf-fill"></i> Estimado acumulado</div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }

    .stat-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }

    .sc-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .sc-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .sc-chip {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 10px;
      font-size: 1rem;
      flex-shrink: 0;
    }
    .sc-chip.blue   { background: #e0f2fe; color: #0284c7; }
    .sc-chip.green  { background: #dcfce7; color: #16a34a; }
    .sc-chip.yellow { background: #fef9c3; color: #ca8a04; }
    .sc-chip.purple { background: #ede9fe; color: #7c3aed; }

    .sc-value {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
    }
    .sc-value small {
      font-size: 1rem;
      font-weight: 600;
      color: #64748b;
    }
    .sc-trend {
      font-size: 0.78rem;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }
    .sc-trend i { font-size: 0.85rem; }

    .ml-auto { margin-left: auto; }
  `]
})
export class AdminMetricsComponent implements OnInit {
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  metrics = signal<AdminMetrics | null>(null);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.adminService.getMetrics().subscribe({
      next: (res) => {
        this.metrics.set(res);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al obtener las métricas del sistema.');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
