import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QrService, QRGenerateResponse } from '../../../core/services/qr.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-citizen-qr',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container fade-in">
      <div class="qr-card card">
        <div class="card-header">
          <h2>🪪 Carnet Digital EcoPuntos</h2>
          <p>Presenta este código QR en cualquier EcoPunto de Pamplona para identificarte</p>
        </div>

        <div *ngIf="loading()" class="spinner-box">
          <div class="spinner"></div>
          <p>Generando tu código QR personal en vivo...</p>
        </div>

        <div *ngIf="errorMessage()" class="alert alert-error">
          ⚠️ {{ errorMessage() }}
        </div>

        <div *ngIf="!loading() && qrData() as data" class="card-body">
          <div class="user-badge-header">
            <div class="avatar">{{ data.user.name.charAt(0).toUpperCase() }}</div>
            <div class="user-info">
              <h3>{{ data.user.name }}</h3>
              <div class="badge-row">
                <span class="user-level">🌱 {{ data.user.level || 'Semilla Verde' }}</span>
                <span class="user-points">⭐ {{ data.user.total_points }} Puntos</span>
              </div>
            </div>
          </div>

          <div class="qr-visual-box">
            <div class="qr-frame">
              <img
                *ngIf="qrImageUrl()"
                [src]="qrImageUrl()"
                alt="Carnet QR EcoPuntos"
                class="qr-img"
                id="qrImageElement"
              />
              <div *ngIf="!qrImageUrl()" class="spinner" style="margin: 40px auto;"></div>
            </div>
            <div class="user-id-code">ID de Ciudadano: <strong>#{{ data.user.id }}</strong></div>
          </div>

          <div class="qr-actions">
            <button class="btn btn-secondary btn-sm" (click)="copyPayload(data.qr)">
              📋 {{ copied() ? '¡Copiado!' : 'Copiar Código' }}
            </button>
            <button class="btn btn-primary btn-sm" (click)="downloadQRImage(data.user.name)">
              💾 Guardar Imagen de Carnet
            </button>
          </div>

          <div class="qr-payload-text mt-3">
            <label>Contenido del Código (JSON):</label>
            <code>{{ data.qr }}</code>
          </div>

          <div class="instructions alert alert-warning mt-3">
            📌 El Gestor de Punto escaneará este carnet (o la foto guardada) para verificar tu perfil y cargar tus entregas.
          </div>

          <div class="citizen-quick-links mt-4">
            <a routerLink="/deliveries" class="btn btn-outline-primary btn-full">
              📦 Realizar Pre-solicitud o Ver Mis Entregas →
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .qr-card {
      max-width: 480px;
      margin: 0 auto;
      padding: 0;
      overflow: hidden;
    }
    .card-header {
      background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .card-header h2 { margin: 0 0 6px 0; font-size: 1.4rem; color: white; }
    .card-header p { margin: 0; font-size: 0.88rem; opacity: 0.85; color: white; }

    .card-body { padding: 24px; text-align: center; }

    .user-badge-header {
      display: flex;
      align-items: center;
      gap: 14px;
      background: #f0faf3;
      border: 1px solid #b7e4c7;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 20px;
      text-align: left;
    }
    .avatar {
      width: 46px; height: 46px;
      background: linear-gradient(135deg, #52b788, #1b4332);
      color: white;
      border-radius: 50%;
      display: flex; justify-content: center; align-items: center;
      font-size: 1.3rem; font-weight: 700;
      flex-shrink: 0;
    }
    .user-info h3 { margin: 0 0 4px 0; font-size: 1.05rem; color: #1b4332; }
    .badge-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .user-level { font-size: 0.75rem; background: #d8f3dc; color: #1b4332; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
    .user-points { font-size: 0.82rem; color: #b45309; font-weight: 700; }

    .qr-visual-box { margin: 20px 0; }
    .qr-frame {
      width: 220px; height: 220px;
      margin: 0 auto 12px;
      padding: 8px;
      background: white;
      border-radius: 14px;
      border: 3px solid #2d6a4f;
      box-shadow: 0 6px 20px rgba(0,0,0,0.08);
      display: flex; align-items: center; justify-content: center;
    }
    .qr-img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
    .user-id-code { font-weight: 600; color: #2d6a4f; font-size: 0.95rem; }

    .qr-actions { display: flex; justify-content: center; gap: 10px; margin-bottom: 16px; }
    .btn-secondary { background: #e2e8f0; color: #334155; }

    .qr-payload-text {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      border-radius: 8px;
      text-align: left;
    }
    .qr-payload-text label { display: block; font-size: 0.72rem; color: #64748b; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; }
    .qr-payload-text code { font-size: 0.78rem; color: #334155; word-break: break-all; font-family: monospace; }

    .spinner-box { padding: 40px; text-align: center; color: #2d6a4f; }
    .btn-outline-primary { border: 1px solid #2d6a4f; color: #2d6a4f; background: transparent; font-weight: 700; }
    .btn-outline-primary:hover { background: #2d6a4f; color: white; }
    .btn-full { width: 100%; justify-content: center; display: flex; padding: 12px; }
    .mt-3 { margin-top: 14px; }
    .mt-4 { margin-top: 18px; }
  `]
})
export class CitizenQrComponent implements OnInit {
  private qrService = inject(QrService);
  private cdr = inject(ChangeDetectorRef);

  qrData = signal<QRGenerateResponse | null>(null);
  qrImageUrl = signal<string>('');
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');
  copied = signal<boolean>(false);

  ngOnInit(): void {
    this.loadQR();
  }

  loadQR(): void {
    this.loading.set(true);
    this.qrService.generate().subscribe({
      next: (res) => {
        this.qrData.set(res);
        this.loading.set(false);
        this.renderQRCode(res.qr);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al generar el código QR personal.');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private renderQRCode(payload: string): void {
    QRCode.toDataURL(payload, {
      width: 400,
      margin: 1,
      color: {
        dark: '#1b4332',
        light: '#ffffff'
      }
    })
    .then(url => {
      this.qrImageUrl.set(url);
      this.cdr.detectChanges();
    })
    .catch(err => {
      console.error('Error generando DataURL de QR:', err);
    });
  }

  copyPayload(payload: string): void {
    navigator.clipboard.writeText(payload).then(() => {
      this.copied.set(true);
      this.cdr.detectChanges();
      setTimeout(() => { this.copied.set(false); this.cdr.detectChanges(); }, 2000);
    });
  }

  downloadQRImage(userName: string): void {
    const url = this.qrImageUrl();
    if (!url) return;

    const a = document.createElement('a');
    a.download = `Carnet_EcoPuntos_${userName.replace(/\s+/g, '_')}.png`;
    a.href = url;
    a.click();
  }
}
