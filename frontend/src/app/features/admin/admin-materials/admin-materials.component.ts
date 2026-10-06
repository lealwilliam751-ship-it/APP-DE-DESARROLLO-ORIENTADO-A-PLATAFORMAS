import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialService } from '../../../core/services/material.service';
import { Material } from '../../../core/models/material.model';

@Component({
  selector: 'app-admin-materials',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-materials-container">
      <div class="header">
        <h1>♻️ Administración de Materiales Reciclables</h1>
        <button class="btn-create" (click)="openModal()">+ Nuevo Material</button>
      </div>

      <div *ngIf="loading" class="spinner-box">Cargando catálogo de materiales...</div>
      <div *ngIf="alertMessage" class="alert" [ngClass]="alertType">{{ alertMessage }}</div>

      <div class="materials-table-card" *ngIf="!loading">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Material</th>
              <th>Puntos por Kg</th>
              <th>CO₂ Evitado (kg/kg)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of materials">
              <td>#{{ m.id }}</td>
              <td><strong>{{ m.name }}</strong></td>
              <td><span class="badge points">⭐ {{ m.points_per_kg }} pts/kg</span></td>
              <td><span class="badge co2">🌱 {{ m.co2_kg_per_kg }} kg CO₂</span></td>
              <td class="actions">
                <button class="btn-edit" (click)="openModal(m)">✏️ Editar</button>
                <button class="btn-delete" (click)="confirmDelete(m)">🗑️ Eliminar</button>
              </td>
            </tr>
            <tr *ngIf="materials.length === 0">
              <td colspan="5" class="empty-state">No hay materiales configurados.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Formulario -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar Material' : 'Crear Nuevo Material' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="materialForm" (ngSubmit)="saveMaterial()" class="modal-body">
            <div class="form-group">
              <label>Nombre del Material *</label>
              <input type="text" formControlName="name" placeholder="Ej. Cartón Ondulado" />
              <span *ngIf="isFieldInvalid('name')" class="field-error">El nombre es obligatorio.</span>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label>Puntos por Kg *</label>
                <input type="number" formControlName="points_per_kg" placeholder="50" />
                <span *ngIf="isFieldInvalid('points_per_kg')" class="field-error">Puntos requeridos (>0).</span>
              </div>
              <div class="form-group col">
                <label>CO₂ Evitado (kg por kg) *</label>
                <input type="number" step="0.1" formControlName="co2_kg_per_kg" placeholder="1.5" />
                <span *ngIf="isFieldInvalid('co2_kg_per_kg')" class="field-error">CO₂ requerido (>=0).</span>
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
    .admin-materials-container {
      max-width: 1000px;
      margin: 30px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header h1 { color: #1b4332; font-size: 1.8rem; margin: 0; }
    .btn-create { background-color: #2d6a4f; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-create:hover { background-color: #1b4332; }
    .materials-table-card { background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th, .data-table td { padding: 14px 18px; border-bottom: 1px solid #eee; }
    .data-table th { background-color: #f8f9fa; color: #2d6a4f; font-weight: 600; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
    .badge.points { background: #fff8e1; color: #f57f17; }
    .badge.co2 { background: #e8f5e9; color: #2e7d32; }
    .actions { display: flex; gap: 8px; }
    .btn-edit { background: #e3f2fd; color: #1565c0; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; }
    .btn-delete { background: #ffebee; color: #c62828; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; }
    .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-card { background: white; border-radius: 12px; width: 100%; max-width: 500px; overflow: hidden; }
    .modal-header { background: #2d6a4f; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
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
export class AdminMaterialsComponent implements OnInit {
  private materialService = inject(MaterialService);
  private fb = inject(FormBuilder);

  materials: Material[] = [];
  loading = true;
  submitting = false;
  showModal = false;
  isEditing = false;
  currentId: number | null = null;
  alertMessage = '';
  alertType = 'success';

  materialForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    points_per_kg: [50, [Validators.required, Validators.min(1)]],
    co2_kg_per_kg: [1.5, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.loading = true;
    this.materialService.getAll().subscribe({
      next: (data) => {
        this.materials = data;
        this.loading = false;
      },
      error: () => {
        this.showAlert('Error al cargar la lista de materiales.', 'error');
        this.loading = false;
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.materialForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openModal(material?: Material): void {
    this.showModal = true;
    if (material) {
      this.isEditing = true;
      this.currentId = material.id;
      this.materialForm.patchValue(material);
    } else {
      this.isEditing = false;
      this.currentId = null;
      this.materialForm.reset({ points_per_kg: 50, co2_kg_per_kg: 1.5 });
    }
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveMaterial(): void {
    if (this.materialForm.invalid) {
      this.materialForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.materialForm.value;

    if (this.isEditing && this.currentId) {
      this.materialService.update(this.currentId, formData).subscribe({
        next: () => {
          this.showAlert('Material actualizado con éxito.', 'success');
          this.submitting = false;
          this.closeModal();
          this.loadMaterials();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al actualizar el material.', 'error');
          this.submitting = false;
        }
      });
    } else {
      this.materialService.create(formData).subscribe({
        next: () => {
          this.showAlert('Material creado con éxito.', 'success');
          this.submitting = false;
          this.closeModal();
          this.loadMaterials();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al crear el material.', 'error');
          this.submitting = false;
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
    this.alertMessage = msg;
    this.alertType = type;
    setTimeout(() => { this.alertMessage = ''; }, 4000);
  }
}
