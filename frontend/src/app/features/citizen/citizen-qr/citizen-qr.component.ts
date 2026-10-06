import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrService, QRGenerateResponse } from '../../../core/services/qr.service';

@Component({
  selector: 'app-citizen-qr',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="citizen-qr-container">
      <div class="qr-card">
        <div class="card-header">
          <h2>🪪 Mi Carnet EcoPuntos</h2>
          <p>Presenta este código QR en cualquier EcoPunto de Pamplona para identificarte.</p>
        </div>

        <div *ngIf="loading" class="spinner-box">
          <div class="spinner"></div>
          <p>Generando código QR personal...</p>
        </div>

        <div *ngIf="errorMessage" class="alert error">
          ⚠️ {{ errorMessage }}
        </div>

        <div *ngIf="!loading && qrData" class="card-body">
          <div class="user-badge-header">
            <div class="avatar">{{ qrData.user.name.charAt(0) }}</div>
            <div class="user-info">
              <h3>{{ qrData.user.name }}</h3>
              <span class="user-level">🌱 {{ qrData.user.level }}</span>
              <span class="user-points">⭐ {{ qrData.user.total_points }} Puntos</span>
            </div>
          </div>

          <div class="qr-visual-box">
            <!-- Representación gráfica interactiva del QR con patrón dinámico -->
            <div class="qr-frame">
              <svg class="qr-svg" viewBox="0 0 100 100">
                <!-- Patrón decorativo de QR -->
                <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                <rect x="5" y="5" width="25" height="25" fill="#1b4332" />
                <rect x="9" y="9" width="17" height="17" fill="#ffffff" />
                <rect x="13" y="13" width="9" height="9" fill="#1b4332" />

                <rect x="70" y="5" width="25" height="25" fill="#1b4332" />
                <rect x="74" y="9" width="17" height="17" fill="#ffffff" />
                <rect x="78" y="13" width="9" height="9" fill="#1b4332" />

                <rect x="5" y="70" width="25" height="25" fill="#1b4332" />
                <rect x="9" y="74" width="17" height="17" fill="#ffffff" />
                <rect x="13" y="78" width="9" height="9" fill="#1b4332" />

                <!-- Puntos internos simulación -->
                <rect x="35" y="10" width="6" height="6" fill="#2d6a4f" />
                <rect x="45" y="10" width="10" height="6" fill="#1b4332" />
                <rect x="40" y="25" width="15" height="6" fill="#2d6a4f" />
                <rect x="10" y="40" width="8" height="15" fill="#1b4332" />
                <rect x="25" y="45" width="12" height="8" fill="#2d6a4f" />
                <rect x="45" y="40" width="20" height="20" fill="#1b4332" />
                <rect x="70" y="40" width="10" height="10" fill="#2d6a4f" />
                <rect x="85" y="45" width="10" height="15" fill="#1b4332" />
                <rect x="40" y="70" width="15" height="8" fill="#2d6a4f" />
                <rect x="60" y="75" width="15" height="15" fill="#1b4332" />
                <rect x="80" y="80" width="15" height="15" fill="#2d6a4f" />
              </svg>
            </div>
            <div class="user-id-code">ID Usuario: #{{ qrData.user.id }}</div>
          </div>

          <div class="qr-payload-text">
            <label>Payload encriptado / JSON:</label>
            <code>{{ qrData.qr }}</code>
          </div>

          <div class="instructions">
            📌 El gestor de punto escaneará esta pantalla con su teléfono o escáner para cargar automáticamente tus entregas.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .citizen-qr-container {
      max-width: 500px;
      margin: 30px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .qr-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.12);
      overflow: hidden;
    }
    .card-header {
      background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .card-header h2 { margin: 0 0 6px 0; font-size: 1.4rem; }
    .card-header p { margin: 0; font-size: 0.88rem; opacity: 0.9; }
    .card-body { padding: 24px; text-align: center; }
    .user-badge-header {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #f4fbf7;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 20px;
      text-align: left;
    }
    .avatar {
      width: 48px;
      height: 48px;
      background: #2d6a4f;
      color: white;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1.5rem;
      font-weight: 700;
    }
    .user-info h3 { margin: 0 0 4px 0; font-size: 1.1rem; color: #1b4332; }
    .user-level { font-size: 0.8rem; background: #d8f3dc; color: #1b4332; padding: 2px 6px; border-radius: 4px; margin-right: 6px; font-weight: 600; }
    .user-points { font-size: 0.85rem; color: #d97706; font-weight: 700; }
    .qr-visual-box {
      margin: 20px 0;
    }
    .qr-frame {
      width: 200px;
      height: 200px;
      margin: 0 auto 10px;
      padding: 12px;
      background: white;
      border-radius: 12px;
      border: 3px solid #2d6a4f;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .qr-svg { width: 100%; height: 100%; }
    .user-id-code { font-weight: 700; color: #2d6a4f; font-size: 0.9rem; }
    .qr-payload-text {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 16px;
      text-align: left;
    }
    .qr-payload-text label { display: block; font-size: 0.75rem; color: #666; margin-bottom: 4px; }
    .qr-payload-text code { font-size: 0.75rem; color: #333; word-break: break-all; }
    .instructions { font-size: 0.82rem; color: #555; background: #fff8e1; padding: 10px; border-radius: 6px; border-left: 4px solid #ffb703; text-align: left; }
    .spinner-box { padding: 40px; color: #2d6a4f; }
    .spinner { width: 36px; height: 36px; border: 4px solid #d8f3dc; border-top-color: #2d6a4f; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .alert.error { background: #ffddd2; color: #c1121f; padding: 12px; border-radius: 6px; }
  `]
})
export class CitizenQrComponent implements OnInit {
  private qrService = inject(QrService);

  qrData: QRGenerateResponse | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadQR();
  }

  loadQR(): void {
    this.loading = true;
    this.qrService.generate().subscribe({
      next: (res) => {
        this.qrData = res;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Error al generar el código QR personal.';
        this.loading = false;
      }
    });
  }
}
