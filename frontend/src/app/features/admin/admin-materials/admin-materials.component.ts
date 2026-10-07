import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialService } from '../../../core/services/material.service';
import { Material } from '../../../core/models/material.model';

@Component({
  selector: 'app-admin-materials',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container fade-in">
      <div class="page-header">
        <div>
          <h2>♻️ Gestión de Materiales Reciclables</h2>
          <p style="color: #64748b; font-size: 0.95rem;">Administra las equivalencias de puntos y CO₂ por kilogramo</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">+ Nuevo Material</button>
      </div>

      <!-- Spinner -->
      <div class="spinner" *ngIf="loading()"></div>

      <!-- Alert Message -->
      <div class="alert" [ngClass]="alertType() === 'success' ? 'alert-success' : 'alert-error'" *ngIf="alertMessage()">
        {{ alertType() === 'success' ? '✅' : '⚠️' }} {{ alertMessage() }}
      </div>

      <!-- Table Card -->
      <div class="card" *ngIf="!loading()">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 70px;">ID</th>
                <th>Material</th>
                <th>Puntos por Kg</th>
                <th>CO₂ Evitado por Kg</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of materials()">
                <td><span class="id-badge">#{{ m.id }}</span></td>
                <td><strong>{{ m.name }}</strong></td>
                <td><span class="pill pill-yellow">⭐ {{ m.points_per_kg }} pts/kg</span></td>
                <td><span class="pill pill-green">🌱 {{ m.co2_kg_per_kg }} kg CO₂</span></td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 6px;">
                    <button class="btn btn-sm btn-secondary" (click)="openModal(m)">✏️ Editar</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmDelete(m)">🗑️ Eliminar</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="materials().length === 0">
                <td colspan="5" style="text-align: center; color: #64748b; padding: 32px;">No hay materiales configurados en el sistema.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Form -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-card card">
          <div class="modal-header">
            <h3>{{ isEditing() ? '✏️ Editar Material' : '✨ Crear Nuevo Material' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="materialForm" (ngSubmit)="saveMaterial()" class="modal-body">
            <div class="form-group">
              <label class="form-label">Nombre del Material *</label>
              <input type="text" formControlName="name" placeholder="Ej. Plásticos PET / Cartón" class="form-control" />
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Puntos por Kg *</label>
                <input type="number" formControlName="points_per_kg" placeholder="50" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">CO₂ Evitado (kg/kg) *</label>
                <input type="number" step="0.1" formControlName="co2_kg_per_kg" placeholder="1.5" class="form-control" />
              </div>
            </div>

            <div class="modal-footer mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" [disabled]="submitting()" class="btn btn-primary">
                {{ submitting() ? 'Guardando...' : (isEditing() ? 'Actualizar Material' : 'Guardar Material') }}
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
    .modal-card { width: 100%; max-width: 480px; padding: 0; overflow: hidden; }
    .modal-header { background: #1b4332; color: white; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; color: white; font-size: 1.15rem; }
    .close-btn { background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; }
    .modal-body { padding: 24px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; }
    .mt-4 { margin-top: 20px; }
  `]
})
export class AdminMaterialsComponent implements OnInit {
  private materialService = inject(MaterialService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  materials = signal<Material[]>([]);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentId = signal<number | null>(null);
  alertMessage = signal<string>('');
  alertType = signal<'success' | 'error'>('success');

  materialForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    points_per_kg: [50, [Validators.required, Validators.min(1)]],
    co2_kg_per_kg: [1.5, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.loading.set(true);
    this.materialService.getAll().subscribe({
      next: (data) => {
        this.materials.set(data || []);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showAlert('Error al cargar los materiales.', 'error');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  openModal(material?: Material): void {
    this.showModal.set(true);
    if (material) {
      this.isEditing.set(true);
      this.currentId.set(material.id);
      this.materialForm.patchValue(material);
    } else {
      this.isEditing.set(false);
      this.currentId.set(null);
      this.materialForm.reset({ points_per_kg: 50, co2_kg_per_kg: 1.5 });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveMaterial(): void {
    if (this.materialForm.invalid) {
      this.materialForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const formData = this.materialForm.value;

    if (this.isEditing() && this.currentId()) {
      this.materialService.update(this.currentId()!, formData).subscribe({
        next: () => {
          this.showAlert('Material actualizado con éxito.', 'success');
          this.submitting.set(false);
          this.closeModal();
          this.loadMaterials();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al actualizar el material.', 'error');
          this.submitting.set(false);
        }
      });
    } else {
      this.materialService.create(formData).subscribe({
        next: () => {
          this.showAlert('Material creado con éxito.', 'success');
          this.submitting.set(false);
          this.closeModal();
          this.loadMaterials();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al crear el material.', 'error');
          this.submitting.set(false);
        }
      });
    }
  }

  confirmDelete(material: Material): void {
    if (confirm(`¿Estás seguro de eliminar el material "${material.name}"?`)) {
      this.materialService.delete(material.id).subscribe({
        next: () => {
          this.showAlert('Material eliminado correctamente.', 'success');
          this.loadMaterials();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al eliminar el material.', 'error');
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
