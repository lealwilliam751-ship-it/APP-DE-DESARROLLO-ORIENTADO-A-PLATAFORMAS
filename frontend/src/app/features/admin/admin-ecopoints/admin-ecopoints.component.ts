import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EcoPointService } from '../../../core/services/ecopoint.service';
import { EcoPoint } from '../../../core/models/ecopoint.model';

@Component({
  selector: 'app-admin-ecopoints',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-ecopoints-container">
      <div class="header">
        <h1>📍 Administración de EcoPuntos</h1>
        <button class="btn-create" (click)="openModal()">+ Nuevo EcoPunto</button>
      </div>

      <div *ngIf="loading" class="spinner-box">Cargando EcoPuntos...</div>
      <div *ngIf="alertMessage" class="alert" [ngClass]="alertType">{{ alertMessage }}</div>

      <div class="ecopoints-table-card" *ngIf="!loading">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Ciudad</th>
              <th>Coordenadas (Lat, Lng)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ep of ecopoints">
              <td>#{{ ep.id }}</td>
              <td><strong>{{ ep.name }}</strong></td>
              <td>{{ ep.address }}</td>
              <td><span class="city-tag">{{ ep.city }}</span></td>
              <td>{{ ep.lat }}, {{ ep.lng }}</td>
              <td class="actions">
                <button class="btn-edit" (click)="openModal(ep)">✏️ Editar</button>
                <button class="btn-delete" (click)="confirmDelete(ep)">🗑️ Eliminar</button>
              </td>
            </tr>
            <tr *ngIf="ecopoints.length === 0">
              <td colspan="6" class="empty-state">No hay EcoPuntos registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Formulario -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar EcoPunto' : 'Crear Nuevo EcoPunto' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="ecopointForm" (ngSubmit)="saveEcoPoint()" class="modal-body">
            <div class="form-group">
              <label>Nombre del EcoPunto *</label>
              <input type="text" formControlName="name" placeholder="Ej. EcoPunto Universidad" />
              <span *ngIf="isFieldInvalid('name')" class="field-error">El nombre es obligatorio.</span>
            </div>

            <div class="form-group">
              <label>Dirección *</label>
              <input type="text" formControlName="address" placeholder="Ej. Carrera 4 # 7-12" />
              <span *ngIf="isFieldInvalid('address')" class="field-error">La dirección es obligatoria.</span>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label>Ciudad</label>
                <input type="text" formControlName="city" placeholder="Pamplona" />
              </div>
              <div class="form-group col">
                <label>Latitud *</label>
                <input type="number" step="0.0001" formControlName="lat" placeholder="7.3762" />
                <span *ngIf="isFieldInvalid('lat')" class="field-error">Latitud requerida.</span>
              </div>
              <div class="form-group col">
                <label>Longitud *</label>
                <input type="number" step="0.0001" formControlName="lng" placeholder="-72.6475" />
                <span *ngIf="isFieldInvalid('lng')" class="field-error">Longitud requerida.</span>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
              <button type="submit" [disabled]="submitting" class="btn-save">
                {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-ecopoints-container {
      max-width: 1100px;
      margin: 30px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header h1 {
      color: #1b4332;
      font-size: 1.8rem;
      margin: 0;
    }
    .btn-create {
      background-color: #2d6a4f;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-create:hover { background-color: #1b4332; }
    .ecopoints-table-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th, .data-table td {
      padding: 14px 18px;
      border-bottom: 1px solid #eee;
    }
    .data-table th {
      background-color: #f8f9fa;
      color: #2d6a4f;
      font-weight: 600;
    }
    .city-tag {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .btn-edit {
      background: #e3f2fd;
      color: #1565c0;
      border: none;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-delete {
      background: #ffebee;
      color: #c62828;
      border: none;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-card {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 550px;
      overflow: hidden;
    }
    .modal-header {
      background: #2d6a4f;
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { margin: 0; }
    .close-btn { background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; }
    .modal-body { padding: 20px; }
    .form-group { margin-bottom: 16px; display: flex; flex-direction: column; }
    .form-row { display: flex; gap: 12px; }
    .col { flex: 1; }
    label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #444; }
    input { padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; }
    .field-error { color: #d32f2f; font-size: 0.75rem; margin-top: 2px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .btn-cancel { background: #eee; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .btn-save { background: #2d6a4f; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .alert { padding: 12px; border-radius: 6px; margin-bottom: 16px; }
    .alert.success { background: #d8f3dc; color: #1b4332; }
    .alert.error { background: #ffddd2; color: #c1121f; }
  `]
})
export class AdminEcopointsComponent implements OnInit {
  private ecopointService = inject(EcoPointService);
  private fb = inject(FormBuilder);

  ecopoints: EcoPoint[] = [];
  loading = true;
  submitting = false;
  showModal = false;
  isEditing = false;
  currentId: number | null = null;
  alertMessage = '';
  alertType = 'success';

  ecopointForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    city: ['Pamplona', Validators.required],
    lat: [7.3758, [Validators.required]],
    lng: [-72.6483, [Validators.required]]
  });

  ngOnInit(): void {
    this.loadEcopoints();
  }

  loadEcopoints(): void {
    this.loading = true;
    this.ecopointService.getAll().subscribe({
      next: (data) => {
        this.ecopoints = data;
        this.loading = false;
      },
      error: () => {
        this.showAlert('Error al cargar la lista de EcoPuntos.', 'error');
        this.loading = false;
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.ecopointForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openModal(ecopoint?: EcoPoint): void {
    this.showModal = true;
    if (ecopoint) {
      this.isEditing = true;
      this.currentId = ecopoint.id;
      this.ecopointForm.patchValue(ecopoint);
    } else {
      this.isEditing = false;
      this.currentId = null;
      this.ecopointForm.reset({ city: 'Pamplona', lat: 7.3758, lng: -72.6483 });
    }
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveEcoPoint(): void {
    if (this.ecopointForm.invalid) {
      this.ecopointForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.ecopointForm.value;

    if (this.isEditing && this.currentId) {
      this.ecopointService.update(this.currentId, formData).subscribe({
        next: () => {
          this.showAlert('EcoPunto actualizado con éxito.', 'success');
          this.submitting = false;
          this.closeModal();
          this.loadEcopoints();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al actualizar EcoPunto.', 'error');
          this.submitting = false;
        }
      });
    } else {
      this.ecopointService.create(formData).subscribe({
        next: () => {
          this.showAlert('EcoPunto creado con éxito.', 'success');
          this.submitting = false;
          this.closeModal();
          this.loadEcopoints();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al crear EcoPunto.', 'error');
          this.submitting = false;
        }
      });
    }
  }

  confirmDelete(ecopoint: EcoPoint): void {
    if (confirm(`¿Estás seguro de eliminar el EcoPunto "${ecopoint.name}"?`)) {
      this.ecopointService.delete(ecopoint.id).subscribe({
        next: () => {
          this.showAlert('EcoPunto eliminado correctamente.', 'success');
          this.loadEcopoints();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al eliminar el EcoPunto.', 'error');
        }
      });
    }
  }

  showAlert(msg: string, type: 'success' | 'error'): void {
    this.alertMessage = msg;
    this.alertType = type;
    setTimeout(() => { this.alertMessage = ''; }, 4000);
  }
}
