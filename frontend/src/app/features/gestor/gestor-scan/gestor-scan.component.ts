import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QrService, QRScanResponse } from '../../../core/services/qr.service';
import jsQR from 'jsqr';

@Component({
  selector: 'app-gestor-scan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container fade-in">
      <div class="card scan-card">
        <div class="fc-header">
          <h2>📱 Validar Carnet Digital (Código QR)</h2>
          <p>Escanea o sube una imagen de código QR para verificar al ciudadano y registrar su entrega</p>
        </div>

        <div class="card-body">

          <!-- Option selector tabs -->
          <div class="scan-tabs">
            <button
              class="scan-tab-btn"
              [class.active]="scanMode() === 'image'"
              (click)="setScanMode('image')"
            >
              🖼️ Subir Imagen de QR
            </button>
            <button
              class="scan-tab-btn"
              [class.active]="scanMode() === 'manual'"
              (click)="setScanMode('manual')"
            >
              ⌨️ Código Manual / JSON
            </button>
          </div>

          <!-- Mode 1: Image File Upload -->
          <div class="upload-section" *ngIf="scanMode() === 'image'">
            <div
              class="drop-zone"
              [class.has-image]="selectedImagePreview()"
              (click)="fileInput.click()"
              (dragover)="onDragOver($event)"
              (drop)="onDrop($event)"
            >
              <input
                #fileInput
                type="file"
                accept="image/*"
                style="display: none;"
                (change)="onFileSelected($event)"
              />

              <div *ngIf="!selectedImagePreview()" class="dz-prompt">
                <div class="dz-icon">📷</div>
                <strong>Haz clic aquí o arrastra la imagen del código QR</strong>
                <p>Soporta capturas de pantalla, fotos JPG, PNG o WEBP</p>
              </div>

              <div *ngIf="selectedImagePreview()" class="dz-preview">
                <img [src]="selectedImagePreview()" alt="QR cargado" class="preview-img" />
                <div class="dz-preview-info">
                  <span>{{ selectedFileName() }}</span>
                  <button type="button" class="btn btn-sm btn-secondary" (click)="clearImage($event)">
                    🔄 Cambiar Imagen
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Mode 2: Manual Text / JSON Input -->
          <div class="manual-input-box" *ngIf="scanMode() === 'manual'">
            <label class="form-label" for="qrPayload">Payload / Código JSON del QR:</label>
            <div class="input-row">
              <input
                id="qrPayload"
                type="text"
                [(ngModel)]="qrPayload"
                placeholder='Ej. {"id":1,"name":"Juan Rodriguez","email":"1001@ecopuntos.com"}'
                class="form-control"
              />
              <button (click)="scanQR()" [disabled]="loading() || !qrPayload" class="btn btn-primary">
                {{ loading() ? 'Validando...' : 'Validar Código' }}
              </button>
            </div>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage()" class="alert alert-error mt-4">
            ⚠️ {{ errorMessage() }}
          </div>

          <!-- Scan Result Card -->
          <div *ngIf="scanResult() as res" class="citizen-result-card fade-in">
            <div class="result-header">
              <span class="pill pill-green">✅ Ciudadano Validado en Sistema</span>
            </div>

            <div class="citizen-details">
              <div class="detail-item">
                <span class="label">Nombre completo:</span>
                <span class="val">{{ res.citizen.name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Correo / Usuario:</span>
                <span class="val">{{ res.citizen.email }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Nivel Ecológico:</span>
                <span class="pill pill-blue">{{ res.citizen.level || 'Semilla Verde' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Puntos Acumulados:</span>
                <span class="val points-val">⭐ {{ res.citizen.total_points | number }} pts</span>
              </div>
            </div>

            <button (click)="goToDeliveries(res.citizen.id)" class="btn btn-primary btn-full mt-3">
              📦 Registrar Entrega para este Ciudadano →
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .scan-card { max-width: 620px; margin: 0 auto; padding: 0; overflow: hidden; }
    .fc-header { background: linear-gradient(135deg, #1b4332, #2d6a4f); color: white; padding: 24px; }
    .fc-header h2 { margin: 0 0 4px 0; color: white; font-size: 1.3rem; }
    .fc-header p { margin: 0; color: white; opacity: 0.85; font-size: 0.9rem; }
    .card-body { padding: 24px; }

    /* Tabs */
    .scan-tabs {
      display: flex;
      gap: 8px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .scan-tab-btn {
      flex: 1;
      padding: 10px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.88rem;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }
    .scan-tab-btn.active {
      background: white;
      color: #1b4332;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }

    /* Drop Zone */
    .drop-zone {
      border: 2px dashed #b7e4c7;
      background: #f0faf3;
      border-radius: 14px;
      padding: 32px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .drop-zone:hover {
      border-color: #52b788;
      background: #e8f5e9;
    }
    .drop-zone.has-image {
      padding: 16px;
      border-style: solid;
      background: white;
    }
    .dz-icon { font-size: 3rem; margin-bottom: 8px; }
    .dz-prompt strong { display: block; font-size: 1rem; color: #1b4332; margin-bottom: 4px; }
    .dz-prompt p { font-size: 0.82rem; color: #64748b; margin: 0; }

    .dz-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .preview-img {
      max-width: 180px;
      max-height: 180px;
      border-radius: 10px;
      border: 2px solid #52b788;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      object-fit: contain;
    }
    .dz-preview-info {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }

    /* Manual box */
    .manual-input-box { margin-bottom: 16px; }
    .input-row { display: flex; gap: 10px; }
    .input-row input { flex: 1; font-family: monospace; font-size: 0.85rem; }

    /* Result Card */
    .citizen-result-card {
      background: #f0faf3;
      border: 1px solid #b7e4c7;
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
    }
    .result-header { margin-bottom: 14px; }
    .citizen-details { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .detail-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.92rem; }
    .detail-item .label { color: #64748b; font-weight: 500; }
    .detail-item .val { font-weight: 700; color: #1b4332; }
    .points-val { color: #b45309; }
    .btn-full { width: 100%; justify-content: center; padding: 12px; font-weight: 700; }
    .mt-3 { margin-top: 14px; }
    .mt-4 { margin-top: 16px; }
    .btn-secondary { background: #e2e8f0; color: #334155; }

    @media (max-width: 520px) {
      .input-row { flex-direction: column; }
    }
  `]
})
export class GestorScanComponent {
  private qrService = inject(QrService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  scanMode = signal<'image' | 'manual'>('image');
  qrPayload = '';
  selectedImagePreview = signal<string | null>(null);
  selectedFileName = signal<string>('');
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');
  scanResult = signal<QRScanResponse | null>(null);

  setScanMode(mode: 'image' | 'manual'): void {
    this.scanMode.set(mode);
    this.errorMessage.set('');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  clearImage(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedImagePreview.set(null);
    this.selectedFileName.set('');
    this.scanResult.set(null);
    this.errorMessage.set('');
  }

  private processFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP).');
      return;
    }

    this.selectedFileName.set(file.name);
    this.errorMessage.set('');
    this.scanResult.set(null);

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const dataUrl = e.target.result;
      this.selectedImagePreview.set(dataUrl);

      // Extract QR from image pixels using jsQR and canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        if (!context) {
          this.errorMessage.set('No se pudo inicializar el procesador de imágenes.');
          return;
        }

        context.drawImage(img, 0, 0, img.width, img.height);
        const imageData = context.getImageData(0, 0, img.width, img.height);

        // Decode with jsQR
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          this.qrPayload = code.data;
          this.scanQR();
        } else {
          this.errorMessage.set('No se detectó un código QR en la imagen. Asegúrate de que la imagen sea clara.');
          this.cdr.detectChanges();
        }
      };
      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  }

  scanQR(): void {
    if (!this.qrPayload) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.scanResult.set(null);

    this.qrService.scan(this.qrPayload).subscribe({
      next: (res) => {
        this.scanResult.set(res);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Código QR inválido o no reconocido.');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  goToDeliveries(citizenId: number): void {
    this.router.navigate(['/deliveries'], { queryParams: { citizenId } });
  }
}
