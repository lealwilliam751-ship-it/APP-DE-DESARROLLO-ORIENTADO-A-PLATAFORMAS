import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EcoPointService } from '../../core/services/ecopoint.service';
import { EcoPoint } from '../../core/models/ecopoint.model';

@Component({
  selector: 'app-ecopoints',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container fade-in">
      <div class="page-header">
        <div>
          <h2>📍 Puntos de Reciclaje (EcoPuntos)</h2>
          <p style="color: #64748b; font-size: 0.95rem;">Encuentra el punto de acopio y reciclaje más cercano en Pamplona</p>
        </div>
      </div>

      <!-- Loading Spinner -->
      <div class="spinner" *ngIf="loading()"></div>

      <!-- Error alert -->
      <div class="alert alert-error" *ngIf="errorMessage()">
        ⚠️ {{ errorMessage() }}
      </div>

      <!-- Empty state -->
      <div class="card empty-state" *ngIf="!loading() && ecopoints().length === 0 && !errorMessage()">
        <div class="empty-icon">📍</div>
        <p>No se encontraron EcoPuntos registrados en Pamplona.</p>
      </div>

      <!-- EcoPoints Grid -->
      <div class="grid-3" *ngIf="!loading() && ecopoints().length > 0">
        <div *ngFor="let ep of ecopoints()" class="ep-card card">
          <div class="ep-header">
            <div class="ep-badge-icon">♻️</div>
            <span class="ep-city-tag">{{ ep.city }}</span>
          </div>

          <h3 class="ep-title">{{ ep.name }}</h3>
          <p class="ep-address">📍 {{ ep.address }}</p>

          <div class="ep-coords">
            <span>🌐 Lat: <strong>{{ ep.lat }}</strong></span>
            <span>Lng: <strong>{{ ep.lng }}</strong></span>
          </div>

          <a [routerLink]="['/ecopoints', ep.id]" class="btn btn-primary btn-full mt-auto">
            Ver Detalle y Mapa →
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ep-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 12px;
    }
    .ep-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ep-badge-icon {
      font-size: 1.8rem;
      background: #f0faf3;
      width: 48px; height: 48px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid #b7e4c7;
    }
    .ep-city-tag {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ep-title {
      font-size: 1.15rem;
      color: #1b4332;
      font-weight: 700;
      line-height: 1.3;
      margin: 0;
    }
    .ep-address {
      color: #475569;
      font-size: 0.9rem;
      font-weight: 500;
      margin: 0;
    }
    .ep-coords {
      font-size: 0.78rem;
      color: #94a3b8;
      background: #f8fafc;
      padding: 6px 10px;
      border-radius: 6px;
      display: flex;
      gap: 12px;
    }
    .btn-full { width: 100%; justify-content: center; }
    .mt-auto { margin-top: auto; }
  `]
})
export class EcopointsComponent implements OnInit {
  private ecopointService = inject(EcoPointService);
  private cdr = inject(ChangeDetectorRef);

  ecopoints = signal<EcoPoint[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadEcoPoints();
  }

  loadEcoPoints(): void {
    this.loading.set(true);
    this.ecopointService.getAll().subscribe({
      next: (res) => {
        this.ecopoints.set(res || []);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'No se pudieron cargar los EcoPuntos.');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
