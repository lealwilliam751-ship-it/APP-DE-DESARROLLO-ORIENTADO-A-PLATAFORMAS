import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RewardService } from '../../../core/services/reward.service';
import { Reward } from '../../../core/models/reward.model';

@Component({
  selector: 'app-admin-rewards',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container fade-in">
      <div class="page-header">
        <div>
          <h2>🎁 Gestión de Catálogo de Recompensas</h2>
          <p style="color: #64748b; font-size: 0.95rem;">Crea, edita o elimina premios y bonos para la comunidad de Pamplona</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">+ Nueva Recompensa</button>
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
                <th>Nombre y Descripción</th>
                <th>Categoría</th>
                <th>Costo en Puntos</th>
                <th>Stock Disponible</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of rewards()">
                <td><span class="id-badge">#{{ r.id }}</span></td>
                <td>
                  <strong>{{ r.name }}</strong>
                  <p style="color: #64748b; font-size: 0.8rem; margin: 2px 0 0 0;">{{ r.description }}</p>
                </td>
                <td><span class="pill pill-blue">{{ r.category || 'General' }}</span></td>
                <td><span class="pill pill-yellow">⭐ {{ r.point_cost }} pts</span></td>
                <td>
                  <span class="pill" [ngClass]="r.stock === 0 ? 'pill-red' : 'pill-green'">
                    {{ r.stock < 0 ? 'Ilimitado' : (r.stock === 0 ? 'Agotado' : r.stock + ' disp.') }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 6px;">
                    <button class="btn btn-sm btn-secondary" (click)="openModal(r)">✏️ Editar</button>
                    <button class="btn btn-sm btn-danger" (click)="confirmDelete(r)">🗑️ Eliminar</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="rewards().length === 0">
                <td colspan="6" style="text-align: center; color: #64748b; padding: 32px;">No hay recompensas registradas en el sistema.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Form -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-card card">
          <div class="modal-header">
            <h3>{{ isEditing() ? '✏️ Editar Recompensa' : '✨ Crear Nueva Recompensa' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="rewardForm" (ngSubmit)="saveReward()" class="modal-body">
            <div class="form-group">
              <label class="form-label">Nombre de la Recompensa *</label>
              <input type="text" formControlName="name" placeholder="Ej. Bono $10.000 Mercado Local" class="form-control" />
            </div>

            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea formControlName="description" rows="2" placeholder="Detalles de los términos del premio..." class="form-control"></textarea>
            </div>

            <div class="grid-3">
              <div class="form-group">
                <label class="form-label">Categoría</label>
                <input type="text" formControlName="category" placeholder="Bonos, Descuentos" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Costo (Puntos) *</label>
                <input type="number" formControlName="point_cost" placeholder="100" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Stock (-1 = Ilimitado)</label>
                <input type="number" formControlName="stock" placeholder="50" class="form-control" />
              </div>
            </div>

            <div class="modal-footer mt-4">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" [disabled]="submitting()" class="btn btn-primary">
                {{ submitting() ? 'Guardando...' : (isEditing() ? 'Actualizar Recompensa' : 'Guardar Recompensa') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .id-badge { background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; }
    .pill-blue { background: #e0f2fe; color: #0369a1; }
    .btn-secondary { background: #e2e8f0; color: #334155; }
    .btn-secondary:hover { background: #cbd5e1; }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(10,46,26,0.6);
      backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1100;
    }
    .modal-card { width: 100%; max-width: 550px; padding: 0; overflow: hidden; }
    .modal-header { background: #1b4332; color: white; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; color: white; font-size: 1.15rem; }
    .close-btn { background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; }
    .modal-body { padding: 24px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; }
    .mt-4 { margin-top: 20px; }
  `]
})
export class AdminRewardsComponent implements OnInit {
  private rewardService = inject(RewardService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  rewards = signal<Reward[]>([]);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentId = signal<number | null>(null);
  alertMessage = signal<string>('');
  alertType = signal<'success' | 'error'>('success');

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
    this.loading.set(true);
    this.rewardService.getAll().subscribe({
      next: (data) => {
        this.rewards.set(data || []);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showAlert('Error al cargar las recompensas.', 'error');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  openModal(reward?: Reward): void {
    this.showModal.set(true);
    if (reward) {
      this.isEditing.set(true);
      this.currentId.set(reward.id);
      this.rewardForm.patchValue(reward);
    } else {
      this.isEditing.set(false);
      this.currentId.set(null);
      this.rewardForm.reset({ category: 'Descuentos', point_cost: 100, stock: 50 });
    }
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveReward(): void {
    if (this.rewardForm.invalid) {
      this.rewardForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const formData = this.rewardForm.value;

    if (this.isEditing() && this.currentId()) {
      this.rewardService.update(this.currentId()!, formData).subscribe({
        next: () => {
          this.showAlert('Recompensa actualizada con éxito.', 'success');
          this.submitting.set(false);
          this.closeModal();
          this.loadRewards();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al actualizar la recompensa.', 'error');
          this.submitting.set(false);
        }
      });
    } else {
      this.rewardService.create(formData).subscribe({
        next: () => {
          this.showAlert('Recompensa creada con éxito.', 'success');
          this.submitting.set(false);
          this.closeModal();
          this.loadRewards();
        },
        error: (err) => {
          this.showAlert(err.error?.detail || 'Error al crear la recompensa.', 'error');
          this.submitting.set(false);
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
    this.alertMessage.set(msg);
    this.alertType.set(type);
    this.cdr.detectChanges();
    setTimeout(() => { this.alertMessage.set(''); this.cdr.detectChanges(); }, 4000);
  }
}
