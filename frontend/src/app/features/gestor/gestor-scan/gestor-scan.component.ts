import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QrService, QRScanResponse } from '../../../core/services/qr.service';

@Component({
  selector: 'app-gestor-scan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="scan-container">
      <div class="scan-card">
        <div class="card-header">
          <h2>📱 Escanear Código QR de Ciudadano</h2>
          <p>Valida la identidad del ciudadano en el Ecopunto para acreditar su entrega de residuos.</p>
        </div>

        <div class="card-body">
          <div class="qr-camera-mock">
            <div class="scanner-frame">
              <div class="corner top-left"></div>
              <div class="corner top-right"></div>
              <div class="corner bottom-left"></div>
              <div class="corner bottom-right"></div>
              <div class="scan-line"></div>
              <span class="cam-icon">📷</span>
            </div>
            <p class="scan-hint">Posiciona el código QR del ciudadano frente al visor o ingresa el código manual abajo.</p>
          </div>

          <div class="manual-input-box">
            <label for="qrPayload">Payload / Código QR:</label>
            <div class="input-row">
              <input
                id="qrPayload"
                type="text"
                [(ngModel)]="qrPayload"
                placeholder='Ej. {"id":3,"name":"Ana Lucia Perez","email":"ana@ecopuntos.com"}'
              />
              <button (click)="scanQR()" [disabled]="loading || !qrPayload" class="btn-scan">
                {{ loading ? 'Validando...' : 'Escanear / Validar' }}
              </button>
            </div>
          </div>

          <div *ngIf="errorMessage" class="alert error">
            ⚠️ {{ errorMessage }}
          </div>

          <!-- Resultado del escaneo -->
          <div *ngIf="scanResult && scanResult.valid" class="citizen-result-card">
            <div class="result-header">
              <span class="badge-valid">✅ Ciudadano Validado</span>
            </div>
            <div class="citizen-details">
              <div class="detail-item">
                <span class="label">Nombre:</span>
                <span class="val">{{ scanResult.citizen.name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Correo:</span>
                <span class="val">{{ scanResult.citizen.email }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Nivel:</span>
                <span class="val level-badge">{{ scanResult.citizen.level }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Puntos Actuales:</span>
                <span class="val points-val">⭐ {{ scanResult.citizen.total_points }} pts</span>
              </div>
            </div>

            <div class="action-box">
              <button (click)="goToDeliveries(scanResult.citizen.id)" class="btn-delivery">
                📦 Registrar Entrega para este Ciudadano
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scan-container {
      max-width: 650px;
      margin: 30px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .scan-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .card-header {
      background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
      color: white;
      padding: 24px;
    }
    .card-header h2 { margin: 0 0 6px 0; font-size: 1.4rem; }
    .card-header p { margin: 0; font-size: 0.88rem; opacity: 0.9; }
    .card-body { padding: 24px; }
    .qr-camera-mock {
      background: #111;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin-bottom: 24px;
    }
    .scanner-frame {
      width: 180px;
      height: 180px;
      margin: 0 auto 16px;
      border: 2px dashed #52b788;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(255,255,255,0.03);
    }
    .cam-icon { font-size: 3rem; }
    .scan-line {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: #52b788;
      box-shadow: 0 0 8px #52b788;
      animation: scanAnim 2s infinite ease-in-out;
    }
    @keyframes scanAnim {
      0% { top: 0%; }
      50% { top: 95%; }
      100% { top: 0%; }
    }
    .scan-hint { color: #aaa; font-size: 0.85rem; margin: 0; }
    .manual-input-box { margin-bottom: 20px; }
    .manual-input-box label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 6px; }
    .input-row { display: flex; gap: 10px; }
    .input-row input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.85rem;
    }
    .btn-scan {
      background-color: #2d6a4f;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-scan:disabled { opacity: 0.6; cursor: not-allowed; }
    .alert.error {
      background-color: #ffddd2;
      color: #c1121f;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 0.9rem;
    }
    .citizen-result-card {
      background: #f4fbf7;
      border: 2px solid #52b788;
      border-radius: 10px;
      padding: 20px;
      margin-top: 20px;
    }
    .result-header { margin-bottom: 14px; }
    .badge-valid {
      background: #2d6a4f;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .citizen-details { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .detail-item { display: flex; justify-content: space-between; font-size: 0.95rem; }
    .detail-item .label { color: #555; font-weight: 500; }
    .detail-item .val { font-weight: 700; color: #1b4332; }
    .level-badge { background: #d8f3dc; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; }
    .points-val { color: #d97706; }
    .btn-delivery {
      width: 100%;
      background: #1b4332;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
    }
    .btn-delivery:hover { background: #081c15; }
  `]
})
export class GestorScanComponent {
  private qrService = inject(QrService);
  private router = inject(Router);

  qrPayload = '';
  loading = false;
  errorMessage = '';
  scanResult: QRScanResponse | null = null;

  scanQR(): void {
    if (!this.qrPayload) return;

    this.loading = true;
    this.errorMessage = '';
    this.scanResult = null;

    this.qrService.scan(this.qrPayload).subscribe({
      next: (res) => {
        this.scanResult = res;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Código QR inválido o no reconocido.';
        this.loading = false;
      }
    });
  }

  goToDeliveries(citizenId: number): void {
    this.router.navigate(['/deliveries'], { queryParams: { citizenId } });
  }
}
