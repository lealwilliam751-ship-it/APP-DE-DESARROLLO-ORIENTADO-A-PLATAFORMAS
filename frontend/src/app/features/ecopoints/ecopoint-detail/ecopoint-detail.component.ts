import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EcoPointService } from '../../../core/services/ecopoint.service';
import { MaterialService } from '../../../core/services/material.service';
import { EcoPoint } from '../../../core/models/ecopoint.model';
import { Material } from '../../../core/models/material.model';

@Component({
  selector: 'app-ecopoint-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="ecopoint-detail-container">
      <a routerLink="/ecopoints" class="btn-back">← Volver a lista de EcoPuntos</a>

      <div *ngIf="loading" class="spinner-box">
        <div class="spinner"></div>
        <p>Cargando información del EcoPunto...</p>
      </div>

      <div *ngIf="errorMessage" class="alert error">
        ⚠️ {{ errorMessage }}
      </div>

      <div *ngIf="!loading && ecopoint" class="detail-card">
        <div class="card-banner">
          <div class="banner-badge">📍 EcoPunto Activo</div>
          <h1>{{ ecopoint.name }}</h1>
          <p class="address">🏢 {{ ecopoint.address }} — {{ ecopoint.city }}</p>
        </div>

        <div class="card-content">
          <div class="info-section">
            <h3>📍 Ubicación y Coordenadas</h3>
            <div class="geo-badge">
              <span>Latitud: <strong>{{ ecopoint.lat }}</strong></span>
              <span>Longitud: <strong>{{ ecopoint.lng }}</strong></span>
            </div>
            <a
              [href]="'https://www.google.com/maps/search/?api=1&query=' + ecopoint.lat + ',' + ecopoint.lng"
              target="_blank"
              class="btn-maps"
            >
              🗺️ Ver en Google Maps / Trazar Ruta
            </a>
          </div>

          <div class="info-section">
            <h3>♻️ Materiales Aceptados en este Punto</h3>
            <div class="materials-grid">
              <div *ngFor="let m of materials" class="material-card">
                <span class="mat-icon">📦</span>
                <div class="mat-info">
                  <span class="mat-name">{{ m.name }}</span>
                  <span class="mat-points">⭐ {{ m.points_per_kg }} pts / kg</span>
                  <span class="mat-co2">🌱 {{ m.co2_kg_per_kg }} kg CO₂ evitado</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-section schedule">
            <h3>🕒 Horarios de Atención</h3>
            <p>Lunes a Sábado: 8:00 AM - 5:00 PM</p>
            <p>Domingos y Festivos: 9:00 AM - 1:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ecopoint-detail-container {
      max-width: 800px;
      margin: 30px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .btn-back {
      display: inline-block;
      margin-bottom: 20px;
      color: #2d6a4f;
      text-decoration: none;
      font-weight: 600;
    }
    .detail-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .card-banner {
      background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
      color: white;
      padding: 30px;
    }
    .banner-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      margin-bottom: 10px;
    }
    .card-banner h1 { margin: 0 0 8px 0; font-size: 1.8rem; }
    .address { margin: 0; font-size: 1rem; opacity: 0.9; }
    .card-content { padding: 30px; }
    .info-section { margin-bottom: 28px; }
    .info-section h3 { margin: 0 0 12px 0; color: #1b4332; font-size: 1.1rem; }
    .geo-badge {
      display: flex;
      gap: 20px;
      background: #f4fbf7;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 0.95rem;
    }
    .btn-maps {
      display: inline-block;
      background: #2d6a4f;
      color: white;
      text-decoration: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .materials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    .material-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    .mat-icon { font-size: 1.5rem; }
    .mat-info { display: flex; flex-direction: column; }
    .mat-name { font-weight: 700; color: #1b4332; font-size: 0.9rem; }
    .mat-points { color: #d97706; font-size: 0.8rem; font-weight: 600; }
    .mat-co2 { color: #2e7d32; font-size: 0.75rem; }
    .schedule p { margin: 4px 0; font-size: 0.9rem; color: #555; }
    .spinner-box { text-align: center; padding: 40px; color: #2d6a4f; }
    .spinner { width: 36px; height: 36px; border: 4px solid #d8f3dc; border-top-color: #2d6a4f; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .alert.error { background: #ffddd2; color: #c1121f; padding: 12px; border-radius: 6px; }
  `]
})
export class EcopointDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ecopointService = inject(EcoPointService);
  private materialService = inject(MaterialService);

  ecopoint: EcoPoint | null = null;
  materials: Material[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadDetails(id);
    } else {
      this.errorMessage = 'ID de EcoPunto no especificado.';
      this.loading = false;
    }
  }

  loadDetails(id: number): void {
    this.loading = true;
    this.ecopointService.getById(id).subscribe({
      next: (ep) => {
        this.ecopoint = ep;
        this.materialService.getAll().subscribe({
          next: (mats) => {
            this.materials = mats;
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'EcoPunto no encontrado.';
        this.loading = false;
      }
    });
  }
}
