import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RewardService } from '../../../core/services/reward.service';
import { Reward } from '../../../core/models/reward.model';

@Component({
  selector: 'app-admin-rewards',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-rewards-container">
      <div class="header">
        <h1>🎁 Administración de Catálogo de Recompensas</h1>
        <button class="btn-create" (click)="openModal()">+ Nueva Recompensa</button>
      </div>

      <div *ngIf="loading" class="spinner-box">Cargando recompensas...</div>
      <div *ngIf="alertMessage" class="alert" [ngClass]="alertType">{{ alertMessage }}</div>

      <div class="rewards-table-card" *ngIf="!loading">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Costo en Puntos</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of rewards">
              <td>#{{ r.id }}</td>
              <td>
                <strong>{{ r.name }}</strong>
                <p class="desc">{{ r.description }}</p>
              </td>
              <td><span class="cat-tag">{{ r.category || 'General' }}</span></td>
              <td><span class="badge points">⭐ {{ r.point_cost }} pts</span></td>
              <td>
                <span class="badge stock" [class.unlimited]="r.stock === -1">
                  {{ r.stock === -1 ? 'Ilimitado' : r.stock + ' disp.' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-edit" (click)="openModal(r)">✏️ Editar</button>
                <button class="btn-delete" (click)="confirmDelete(r)">🗑️ Eliminar</button>
              </td>
            </tr>
            <tr *ngIf="rewards.length === 0">
              <td colspan="6" class="empty-state">No hay recompensas configuradas.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Formulario -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar Recompensa' : 'Crear Nueva Recompensa' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="rewardForm" (ngSubmit)="saveReward()" class="modal-body">
            <div class="form-group">
              <label>Nombre de la Recompensa *</label>
              <input type="text" formControlName="name" placeholder="Ej. Bono de Descuento Mercado" />
              <span *ngIf="isFieldInvalid('name')" class="field-error">El nombre es obligatorio.</span>
            </div>

            <div class="form-group">
              <label>Descripción</label>
              <textarea formControlName="description" rows="2" placeholder="Detalles de la recompensa..."></textarea>
            </div>

            <div class="form-row">
              <div class="form-group col">
                <label>Categoría</label>
                <input type="text" formControlName="category" placeholder="Ej. Descuentos, Hogar" />
              </div>
              <div class="form-group col">
                <label>Costo (Puntos) *</label>
                <input type="number" formControlName="point_cost" placeholder="100" />
                <span *ngIf="isFieldInvalid('point_cost')" class="field-error">Costo requerido (>0).</span>
              </div>
              <div class="form-group col">
                <label>Stock (-1 = Ilimitado)</label>
                <input type="number" formControlName="stock" placeholder="50" />
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
    .admin-rewards-container {
      max-width: 1050px;
      margin: 30px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header h1 { color: #1b4332; font-size: 1.8rem; margin: 0; }
    .btn-create { background-color: #2d6a4f; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-create:hover { background-color: #1b4332; }
    .rewards-table-card { background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th, .data-table td { padding: 14px 18px; border-bottom: 1px solid #eee; }
    .data-table th { background-color: #f8f9fa; color: #2d6a4f; font-weight: 600; }
    .desc { font-size: 0.8rem; color: #666; margin: 2px 0 0 0; }
    .cat-tag { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
    .badge.points { background: #fff8e1; color: #f57f17; }
    .badge.stock { background: #f3e5f5; color: #7b1fa2; }
    .badge.stock.unlimited { background: #e8f5e9; color: #2e7d32; }
    .actions { display: flex; gap: 8px; }
    .btn-edit { background: #e3f2fd; color: #1565c0; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; }
    .btn-delete { background: #ffebee; color: #c62828; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; }
    .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-card { background: white; border-radius: 12px; width: 100%; max-width: 550px; overflow: hidden; }
    .modal-header { background: #2d6a4f; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; }
    .close-btn { background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; }
    .modal-body { padding: 20px; }
    .form-group { margin-bottom: 16px; display: flex; flex-direction: column; }
    .form-row { display: flex; gap: 12px; }
    .col { flex: 1; }
    label { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #444; }
    input, textarea { padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; }
    .field-error { color: #d32f2f; font-size: 0.75rem; margin-top: 2px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .btn-cancel { background: #eee; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .btn-save { background: #2d6a4f; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .alert { padding: 12px; border-radius: 6px; margin-bottom: 16px; }
    .alert.success { background: #d8f3dc; color: #1b4332; }
    .alert.error { background: #ffddd2; color: #c1121f; }
  `]
})
export class AdminRewardsComponent implements OnInit {
  private rewardService = inject(RewardService);
  private fb = inject(FormBuilder);

  rewards: Reward[] = [];
  loading = true;
  submitting = false;
  showModal = false;
  isEditing = false;
  currentId: number | null = null;
  alertMessage = '';
  alertType = 'success';

  rewardForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    category: ['Descuentos'],
    point_cost: [100, [Validators.required, Validators.min(1)]],
    stock: [50, [Validators.required]]
  });

  ngOnInit(): void {
    this.loadRewards();
  }

  loadRewards(): void {
    this.loading = true;
    this.rewardService.getAll().subscribe({
      next: (data) => {
        this.rewards = data;
        this.loading = false;
      },
      error: () => {
        this.showAlert('Error al cargar la lista de recompensas.', 'error');
        this.loading = false;
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.rewardForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openModal(reward?: Reward): void {
    this.showModal = true;
    if (reward) {
      this.isEditing = true;
      this.currentId = reward.id;
      this.rewardForm.patchValue(reward);
    } else {
      this.isEditing = false;
      this.currentId = null;
      this.rewardForm.reset({ category: 'Descuentos', point_cost: 100, stock: 50 });
    }
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveReward(): void {
    if (this.rewardForm.invalid) {
      this.rewardForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.rewardForm.value;

    if (this.isEditing && this.currentId) {
      this.rewardService.update(this.currentId, formData).subscribe({
        next: () => {
          this.showAlert('Recompensa actualizada con éxito.', 'success');
          this.submitting = false;
          this.closeModal();
          this.loadRewards();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al actualizar la recompensa.', 'error');
          this.submitting = false;
        }
      });
    } else {
      this.rewardService.create(formData).subscribe({
        next: () => {
          this.showAlert('Recompensa creada con éxito.', 'success');
          this.submitting = false;
          this.closeModal();
          this.loadRewards();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al crear la recompensa.', 'error');
          this.submitting = false;
        }
      });
    }
  }

  confirmDelete(reward: Reward): void {
    if (confirm(`¿Estás seguro de eliminar la recompensa "${reward.name}"?`)) {
      this.rewardService.delete(reward.id).subscribe({
        next: () => {
          this.showAlert('Recompensa eliminada correctamente.', 'success');
          this.loadRewards();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al eliminar la recompensa.', 'error');
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
