import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EcoPointService } from '../../../core/services/ecopoint.service';
import { MaterialService } from '../../../core/services/material.service';
import { EcoPoint } from '../../../core/models/ecopoint.model';
import { Material } from '../../../core/models/material.model';

declare const L: any;

@Component({
  selector: 'app-ecopoint-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detail-page">
      <a routerLink="/ecopoints" class="btn-back">← Volver a la lista</a>

      @if (loading()) {
        <div class="loading-box">
          <div class="spinner"></div>
          <p>Cargando información del EcoPunto...</p>
        </div>
      }

      @if (errorMessage()) {
        <div class="alert-error">⚠️ {{ errorMessage() }}</div>
      }

      @if (!loading() && ecopoint()) {
        <div class="content-grid">

          <!-- LEFT: Info Panel -->
          <div class="info-panel">
            <div class="panel-header">
              <div class="ep-icon">♻️</div>
              <div>
                <span class="city-badge">{{ ecopoint()!.city }}</span>
                <h1>{{ ecopoint()!.name }}</h1>
                <p class="address">📍 {{ ecopoint()!.address }}</p>
              </div>
            </div>

            <!-- Distance banner (shown when user location is available) -->
            @if (userLat() !== null) {
              <div class="distance-banner">
                <span class="distance-icon">📏</span>
                <div>
                  <strong>{{ distanceKm() }} km de distancia</strong>
                  <span>desde tu ubicación actual</span>
                </div>
              </div>
            }

            <!-- Location status -->
            @if (locationStatus() === 'asking') {
              <div class="location-status asking">
                <div class="mini-spinner"></div> Obteniendo tu ubicación...
              </div>
            }
            @if (locationStatus() === 'denied') {
              <div class="location-status denied">
                📵 Permiso de ubicación denegado
              </div>
            }

            <!-- Coordinates -->
            <div class="info-block">
              <h3>🌐 Coordenadas GPS</h3>
              <div class="coords-row">
                <div class="coord-chip">
                  <span class="coord-label">Latitud</span>
                  <span class="coord-val">{{ ecopoint()!.lat }}</span>
                </div>
                <div class="coord-chip">
                  <span class="coord-label">Longitud</span>
                  <span class="coord-val">{{ ecopoint()!.lng }}</span>
                </div>
              </div>

              <!-- Navigation button: uses user's current coords as origin if available -->
              <a [href]="getMapsUrl()" target="_blank" rel="noopener noreferrer" class="maps-link">
                🗺️ {{ userLat() !== null ? 'Navegar desde mi ubicación' : 'Abrir en Google Maps' }}
              </a>

              @if (userLat() === null && locationStatus() !== 'asking' && locationStatus() !== 'denied') {
                <button class="btn-locate" (click)="requestLocation()">
                  📍 Usar mi ubicación para ruta
                </button>
              }
            </div>

            <!-- Schedule -->
            <div class="info-block">
              <h3>🕒 Horario de Atención</h3>
              <div class="schedule-list">
                <div class="schedule-row"><span>Lun – Vie</span><strong>8:00 AM – 5:00 PM</strong></div>
                <div class="schedule-row"><span>Sábados</span><strong>8:00 AM – 2:00 PM</strong></div>
                <div class="schedule-row"><span>Dom / Festivos</span><strong>9:00 AM – 1:00 PM</strong></div>
              </div>
            </div>

            <!-- Materials -->
            <div class="info-block">
              <h3>♻️ Materiales Aceptados</h3>
              @if (materials().length === 0) {
                <p class="no-materials">Cargando materiales...</p>
              }
              <div class="materials-list">
                @for (m of materials(); track m.id) {
                  <div class="material-item">
                    <div class="mat-icon-box">📦</div>
                    <div class="mat-info">
                      <strong>{{ m.name }}</strong>
                      <span class="mat-pts">⭐ {{ m.points_per_kg }} puntos/kg</span>
                      <span class="mat-co2">🌱 {{ m.co2_kg_per_kg }} kg CO₂/kg</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- RIGHT: Map Panel -->
          <div class="map-panel">
            <div class="map-header">
              <h3>📍 Mapa Interactivo</h3>
              <span class="map-subtitle">
                @if (userLat() !== null) {
                  🔵 Tu ubicación · 🟢 EcoPunto
                } @else {
                  Haz clic en el marcador para más info
                }
              </span>
            </div>
            <div id="ecopoint-map" class="map-container"></div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 20px 60px;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 24px;
      color: #2d6a4f;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      padding: 8px 16px;
      border-radius: 8px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      transition: all 0.2s;
    }
    .btn-back:hover { background: #dcfce7; }

    .loading-box { text-align: center; padding: 80px 20px; color: #2d6a4f; }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid #d1fae5; border-top-color: #2d6a4f;
      border-radius: 50%; animation: spin 0.9s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .alert-error {
      background: #fef2f2; color: #991b1b;
      padding: 16px 20px; border-radius: 10px;
      border: 1px solid #fecaca; font-weight: 500; margin-bottom: 20px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } }

    /* Info Panel */
    .info-panel {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    .panel-header {
      background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
      color: white; padding: 28px;
      display: flex; align-items: flex-start; gap: 16px;
    }
    .ep-icon {
      font-size: 2rem; background: rgba(255,255,255,0.15);
      width: 52px; height: 52px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .city-badge {
      display: inline-block; background: rgba(255,255,255,0.2);
      padding: 2px 10px; border-radius: 20px;
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.8px;
      text-transform: uppercase; margin-bottom: 8px;
    }
    .panel-header h1 { margin: 0 0 6px; font-size: 1.3rem; font-weight: 700; }
    .address { margin: 0; font-size: 0.85rem; opacity: 0.85; }

    /* Distance Banner */
    .distance-banner {
      display: flex; align-items: center; gap: 12px;
      background: linear-gradient(90deg, #ecfdf5, #f0fdf4);
      border-bottom: 1px solid #bbf7d0;
      padding: 12px 22px;
    }
    .distance-icon { font-size: 1.5rem; }
    .distance-banner div { display: flex; flex-direction: column; gap: 2px; }
    .distance-banner strong { color: #065f46; font-size: 1.05rem; }
    .distance-banner span { color: #6b7280; font-size: 0.78rem; }

    /* Location Status */
    .location-status {
      padding: 10px 22px;
      font-size: 0.82rem;
      display: flex; align-items: center; gap: 8px;
    }
    .location-status.asking { background: #eff6ff; color: #1d4ed8; border-bottom: 1px solid #bfdbfe; }
    .location-status.denied { background: #fef2f2; color: #b91c1c; border-bottom: 1px solid #fecaca; }
    .mini-spinner {
      width: 14px; height: 14px;
      border: 2px solid #bfdbfe; border-top-color: #1d4ed8;
      border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;
    }

    /* Info Blocks */
    .info-block { padding: 18px 22px; border-bottom: 1px solid #f3f4f6; }
    .info-block:last-child { border-bottom: none; }
    .info-block h3 { font-size: 0.9rem; font-weight: 700; color: #1b4332; margin: 0 0 10px; }

    .coords-row { display: flex; gap: 10px; margin-bottom: 10px; }
    .coord-chip {
      flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0;
      border-radius: 8px; padding: 8px 12px;
      display: flex; flex-direction: column; gap: 2px;
    }
    .coord-label { font-size: 0.68rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .coord-val { font-size: 0.88rem; font-weight: 700; color: #1b4332; font-family: monospace; }

    .maps-link {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #2d6a4f; color: white; text-decoration: none;
      padding: 10px 16px; border-radius: 8px;
      font-size: 0.85rem; font-weight: 600;
      transition: background 0.2s; margin-bottom: 8px;
    }
    .maps-link:hover { background: #1b4332; }

    .btn-locate {
      width: 100%; padding: 9px 16px;
      border: 1.5px dashed #2d6a4f; background: transparent;
      color: #2d6a4f; border-radius: 8px; font-size: 0.83rem;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-locate:hover { background: #f0fdf4; }

    /* Schedule */
    .schedule-list { display: flex; flex-direction: column; gap: 6px; }
    .schedule-row {
      display: flex; justify-content: space-between; align-items: center;
      background: #f9fafb; padding: 7px 10px; border-radius: 6px;
      font-size: 0.85rem; color: #374151;
    }
    .schedule-row strong { color: #1b4332; }

    /* Materials */
    .no-materials { color: #9ca3af; font-size: 0.85rem; }
    .materials-list { display: flex; flex-direction: column; gap: 8px; }
    .material-item {
      display: flex; align-items: center; gap: 10px;
      background: #f9fafb; padding: 10px; border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .mat-icon-box { font-size: 1.4rem; }
    .mat-info { display: flex; flex-direction: column; gap: 2px; }
    .mat-info strong { font-size: 0.88rem; color: #111827; }
    .mat-pts { font-size: 0.76rem; color: #d97706; font-weight: 600; }
    .mat-co2 { font-size: 0.73rem; color: #059669; }

    /* Map Panel */
    .map-panel {
      background: white; border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden; border: 1px solid #e5e7eb;
      position: sticky; top: 20px;
    }
    .map-header {
      padding: 14px 18px; border-bottom: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .map-header h3 { margin: 0; font-size: 0.9rem; font-weight: 700; color: #1b4332; }
    .map-subtitle { font-size: 0.76rem; color: #6b7280; }
    .map-container { width: 100%; height: 500px; }
    @media (max-width: 900px) {
      .map-panel { position: static; }
      .map-container { height: 320px; }
    }

    /* Pulse animation for user location marker */
    :global(.user-location-pulse) {
      width: 20px; height: 20px;
      background: #2563eb;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 0 rgba(37,99,235,0.6);
      animation: pulse-ring 1.8s ease-out infinite;
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.6); }
      70%  { box-shadow: 0 0 0 14px rgba(37,99,235,0); }
      100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
    }
  `]
})
export class EcopointDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private ecopointService = inject(EcoPointService);
  private materialService = inject(MaterialService);
  private cdr = inject(ChangeDetectorRef);

  ecopoint = signal<EcoPoint | null>(null);
  materials = signal<Material[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // User location
  userLat = signal<number | null>(null);
  userLng = signal<number | null>(null);
  distanceKm = signal<string>('');
  locationStatus = signal<'idle' | 'asking' | 'granted' | 'denied'>('idle');

  private map: any = null;
  private userMarker: any = null;
  private routeLine: any = null;
  private mapInitialized = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadDetails(id);
    } else {
      this.errorMessage.set('ID de EcoPunto no especificado.');
      this.loading.set(false);
    }
    this.loadLeaflet();
  }

  ngOnDestroy(): void {
    if (this.map) { this.map.remove(); this.map = null; }
  }

  loadLeaflet(): void {
    if ((window as any).L) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    document.head.appendChild(script);
  }

  loadDetails(id: number): void {
    this.ecopointService.getById(id).subscribe({
      next: (ep) => {
        this.ecopoint.set(ep);
        this.loading.set(false);
        this.cdr.detectChanges();

        this.materialService.getAll().subscribe({
          next: (mats) => { this.materials.set(mats); this.cdr.detectChanges(); },
          error: () => {}
        });

        this.tryInitMap(0);
        // Auto-request location after map loads
        setTimeout(() => this.requestLocation(), 800);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'No se pudo cargar el EcoPunto.');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  requestLocation(): void {
    if (!navigator.geolocation) {
      this.locationStatus.set('denied');
      this.cdr.detectChanges();
      return;
    }
    this.locationStatus.set('asking');
    this.cdr.detectChanges();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.userLat.set(lat);
        this.userLng.set(lng);
        this.locationStatus.set('granted');

        const ep = this.ecopoint();
        if (ep) {
          const dist = this.haversineKm(lat, lng, parseFloat(String(ep.lat)), parseFloat(String(ep.lng)));
          this.distanceKm.set(dist < 1 ? (dist * 1000).toFixed(0) + ' m' : dist.toFixed(1));
        }

        this.cdr.detectChanges();
        this.addUserLocationToMap(lat, lng);
      },
      (err) => {
        this.locationStatus.set('denied');
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  getMapsUrl(): string {
    const ep = this.ecopoint();
    if (!ep) return '#';
    const dest = `${ep.lat},${ep.lng}`;
    const uLat = this.userLat();
    const uLng = this.userLng();
    if (uLat !== null && uLng !== null) {
      return `https://www.google.com/maps/dir/${uLat},${uLng}/${dest}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${dest}`;
  }

  // ─── Map Logic ───────────────────────────────────────────────────────────────

  private tryInitMap(attempt: number): void {
    if (this.mapInitialized || attempt > 25) return;

    const mapEl = document.getElementById('ecopoint-map');
    const L = (window as any).L;

    if (!mapEl || !L) {
      setTimeout(() => this.tryInitMap(attempt + 1), 300);
      return;
    }

    this.mapInitialized = true;
    const ep = this.ecopoint()!;
    const epLat = parseFloat(String(ep.lat));
    const epLng = parseFloat(String(ep.lng));

    this.map = L.map('ecopoint-map', { zoomControl: true }).setView([epLat, epLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    // EcoPunto marker (green)
    const epIcon = L.divIcon({
      html: `<div style="
        background:#2d6a4f;width:40px;height:40px;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);font-size:18px;">♻️</span>
      </div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -44]
    });

    L.marker([epLat, epLng], { icon: epIcon })
      .addTo(this.map)
      .bindPopup(`
        <div style="font-family:system-ui;min-width:160px;">
          <strong style="color:#1b4332;">🟢 ${ep.name}</strong><br>
          <span style="color:#6b7280;font-size:0.82rem;">${ep.address}, ${ep.city}</span>
        </div>`, { maxWidth: 220 })
      .openPopup();

    setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 300);
  }

  private addUserLocationToMap(lat: number, lng: number): void {
    if (!this.map) return;
    const L = (window as any).L;
    if (!L) return;

    // Remove old user marker and route
    if (this.userMarker) { this.map.removeLayer(this.userMarker); }
    if (this.routeLine) { this.map.removeLayer(this.routeLine); }

    // User location marker (blue pulsing dot)
    const userIcon = L.divIcon({
      html: `<div style="
        width:22px;height:22px;
        background:#2563eb;
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 0 0 0 rgba(37,99,235,0.5);
        animation:user-pulse 2s ease-out infinite;
      "></div>
      <style>
        @keyframes user-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.5); }
          70%  { box-shadow: 0 0 0 14px rgba(37,99,235,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
      </style>`,
      className: '',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -14]
    });

    this.userMarker = L.marker([lat, lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('<div style="font-family:system-ui;"><strong style="color:#1d4ed8;">🔵 Tu ubicación actual</strong></div>');

    // Draw dashed route line
    const ep = this.ecopoint()!;
    const epLat = parseFloat(String(ep.lat));
    const epLng = parseFloat(String(ep.lng));

    this.routeLine = L.polyline([[lat, lng], [epLat, epLng]], {
      color: '#2563eb',
      weight: 3,
      opacity: 0.7,
      dashArray: '10, 8'
    }).addTo(this.map);

    // Fit map to show both markers
    const bounds = L.latLngBounds([[lat, lng], [epLat, epLng]]);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  // Haversine formula: returns distance in km
  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
      * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  }
}
