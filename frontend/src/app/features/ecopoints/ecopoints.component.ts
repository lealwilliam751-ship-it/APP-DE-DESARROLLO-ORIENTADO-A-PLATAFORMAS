import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EcoPointService } from '../../../app/core/services/ecopoint.service';
import { EcoPoint } from '../../../app/core/models/ecopoint.model';

@Component({
  selector: 'app-ecopoints',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ecopoints-container">
      <div class="header">
        <h2>📍 Ecopuntos en Pamplona</h2>
        <p>Encuentra el punto de acopio y reciclaje más cercano a tu ubicación</p>
      </div>

      <div class="ecopoints-grid">
        <div *ngFor="let ep of ecopoints" class="ep-card">
          <div class="ep-icon">♻️</div>
          <h3>{{ ep.name }}</h3>
          <p class="ep-address">📍 {{ ep.address }}</p>
          <p class="ep-city">🏙️ {{ ep.city }}</p>
          <div class="ep-coords">
            <span>Lat: {{ ep.lat }}</span> | <span>Lng: {{ ep.lng }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ecopoints-container {
      max-width: 1080px;
      margin: 24px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .header h2 { color: #1b4332; margin-top: 0; }
    .header p { color: #64748b; margin-bottom: 24px; }
    .ecopoints-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .ep-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    }
    .ep-icon { font-size: 2rem; margin-bottom: 8px; }
    .ep-card h3 { color: #1b4332; margin: 0 0 8px 0; }
    .ep-address { color: #334155; margin: 4px 0; font-weight: 500; }
    .ep-city { color: #64748b; margin: 4px 0; font-size: 0.9rem; }
    .ep-coords { font-size: 0.8rem; color: #94a3b8; margin-top: 12px; }
  `]
})
export class EcopointsComponent implements OnInit {
  private ecopointService = inject(EcoPointService);
  ecopoints: EcoPoint[] = [];

  ngOnInit(): void {
    this.ecopointService.getAll().subscribe({
      next: (res) => this.ecopoints = res,
      error: () => this.ecopoints = []
    });
  }
}
