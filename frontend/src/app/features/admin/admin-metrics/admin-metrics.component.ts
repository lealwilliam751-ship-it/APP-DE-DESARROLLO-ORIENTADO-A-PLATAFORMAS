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
          <h2>📊 Panel de Métricas Globales</h2>
          <p style="color: #64748b; font-size: 0.95rem;">Resumen en tiempo real del impacto ambiental y participación comunitaria en Pamplona</p>
        </div>
      </div>

      <!-- Loading spinner -->
      <div class="spinner" *ngIf="loading()"></div>

      <!-- Error alert -->
      <div class="alert alert-error" *ngIf="errorMessage()">
        <span>⚠️ {{ errorMessage() }}</span>
        <button class="btn btn-sm btn-danger ml-auto" (click)="loadMetrics()">Reintentar</button>
      </div>

      <!-- Metrics grid -->
      <div class="grid-4" *ngIf="!loading() && metrics() as m">
        <div class="stat-card blue">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ m.totalUsers | number }}</div>
          <div class="stat-label">Usuarios Registrados</div>
        </div>

        <div class="stat-card green">
          <div class="stat-icon">📦</div>
          <div class="stat-value">{{ m.totalDeliveries | number }}</div>
          <div class="stat-label">Entregas Aprobadas</div>
        </div>

        <div class="stat-card yellow">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">{{ m.totalPoints | number }} pts</div>
          <div class="stat-label">Puntos Emitidos Totales</div>
        </div>

        <div class="stat-card purple">
          <div class="stat-icon">🌱</div>
          <div class="stat-value">{{ m.totalCo2 | number:'1.1-2' }} kg</div>
          <div class="stat-label">CO₂ Evitado Estimado</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
