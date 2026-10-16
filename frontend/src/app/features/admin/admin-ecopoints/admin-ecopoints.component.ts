import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EcoPointService } from '../../../core/services/ecopoint.service';
import { EcoPoint } from '../../../core/models/ecopoint.model';

@Component({
  selector: 'app-admin-ecopoints',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container fade-in">
      <div class="page-header">
        <div>
          <h2><i class="bi bi-geo-alt-fill text-success me-2"></i> Gestión de EcoPuntos de Acopio</h2>
          <p style="color: #64748b; font-size: 0.95rem;">Administra las ubicaciones físicas y coordenadas de los puntos de recolección en Pamplona</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()"><i class="bi bi-plus-lg me-1"></i> Nuevo EcoPunto</button>
      </div>

      <!-- Spinner -->
      <div class="spinner" *ngIf="loading()"></div>

      <!-- Alert -->
      <div class="alert" [ngClass]="alertType() === 'success' ? 'alert-success' : 'alert-error'" *ngIf="alertMessage()">
        <i class="bi me-1" [ngClass]="alertType() === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'"></i> {{ alertMessage() }}
      </div>

      <!-- Table Card -->
      <div class="card" *ngIf="!loading()">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 70px;">ID</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Ciudad</th>
                <th>Coordenadas (Lat, Lng)</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ep of ecopoints()">
                <td><span class="id-badge">#{{ ep.id }}</span></td>
                <td><strong>{{ ep.name }}</strong></td>
                <td><i class="bi bi-geo-alt-fill text-muted me-1"></i> {{ ep.address }}</td>
                <td><span class="pill pill-green">{{ ep.city }}</span></td>
                <td style="color: #64748b; font-size: 0.85rem">{{ ep.lat }}, {{ ep.lng }}</td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 6px;">
                    <button class="btn btn-sm btn-secondary" (click)="openModal(ep)"><i class="bi bi-pencil-square me-1"></i> Editar</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmDelete(ep)"><i class="bi bi-trash-fill me-1"></i> Eliminar</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="ecopoints().length === 0">
                <td colspan="6" style="text-align: center; color: #64748b; padding: 32px;">No hay EcoPuntos registrados en el sistema.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Form -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-card card">
          <div class="modal-header">
            <h3><i class="bi me-2" [ngClass]="isEditing() ? 'bi-pencil-square' : 'bi-plus-circle-fill'"></i> {{ isEditing() ? 'Editar EcoPunto' : 'Crear Nuevo EcoPunto' }}</h3>
            <button class="close-btn" (click)="closeModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <form [formGroup]="ecopointForm" (ngSubmit)="saveEcoPoint()" class="modal-body">
            <div class="form-group">
              <label class="form-label">Nombre del EcoPunto *</label>
              <input type="text" formControlName="name" placeholder="Ej. EcoPunto Parque Águeda" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Dirección *</label>
              <input type="text" formControlName="address" placeholder="Ej. Carrera 4 # 7-12" class="form-control" />
            </div>

            <div class="grid-3">
              <div class="form-group">
                <label class="form-label">Ciudad</label>
                <input type="text" formControlName="city" placeholder="Pamplona" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Latitud *</label>
                <input type="number" step="0.0001" formControlName="lat" placeholder="7.3762" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Longitud *</label>
                <input type="number" step="0.0001" formControlName="lng" placeholder="-72.6475" class="form-control" />
              </div>
            </div>

            <div class="modal-footer mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" [disabled]="submitting()" class="btn btn-primary">
                {{ submitting() ? 'Guardando...' : (isEditing() ? 'Actualizar EcoPunto' : 'Guardar EcoPunto') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .id-badge { background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; }
    .btn-secondary { background: #e2e8f0; color: #334155; }
    .btn-secondary:hover { background: #cbd5e1; }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(10,46,26,0.6);
      backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1100;
    }
    .modal-card { width: 100%; max-width: 540px; padding: 0; overflow: hidden; }
    .modal-header { background: #1b4332; color: white; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; color: white; font-size: 1.15rem; }
    .close-btn { background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; }
    .modal-body { padding: 24px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; }
    .mt-4 { margin-top: 20px; }
  `]
})
export class AdminEcopointsComponent implements OnInit {
  private ecopointService = inject(EcoPointService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  ecopoints = signal<EcoPoint[]>([]);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentId = signal<number | null>(null);
  alertMessage = signal<string>('');
  alertType = signal<'success' | 'error'>('success');

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
    this.loading.set(true);
    this.ecopointService.getAll().subscribe({
      next: (data) => {
        this.ecopoints.set(data || []);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showAlert('Error al cargar la lista de EcoPuntos.', 'error');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  openModal(ecopoint?: EcoPoint): void {
    this.showModal.set(true);
    if (ecopoint) {
      this.isEditing.set(true);
      this.currentId.set(ecopoint.id);
      this.ecopointForm.patchValue(ecopoint);
    } else {
      this.isEditing.set(false);
      this.currentId.set(null);
      this.ecopointForm.reset({ city: 'Pamplona', lat: 7.3758, lng: -72.6483 });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveEcoPoint(): void {
    if (this.ecopointForm.invalid) {
      this.ecopointForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const formData = this.ecopointForm.value;

    if (this.isEditing() && this.currentId()) {
      this.ecopointService.update(this.currentId()!, formData).subscribe({
        next: () => {
          this.showAlert('EcoPunto actualizado con éxito.', 'success');
          this.submitting.set(false);
          this.closeModal();
          this.loadEcopoints();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al actualizar EcoPunto.', 'error');
          this.submitting.set(false);
        }
      });
    } else {
      this.ecopointService.create(formData).subscribe({
        next: () => {
          this.showAlert('EcoPunto creado con éxito.', 'success');
          this.submitting.set(false);
          this.closeModal();
          this.loadEcopoints();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al crear EcoPunto.', 'error');
          this.submitting.set(false);
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
    this.alertMessage.set(msg);
    this.alertType.set(type);
    this.cdr.detectChanges();
    setTimeout(() => { this.alertMessage.set(''); this.cdr.detectChanges(); }, 4000);
  }
}
