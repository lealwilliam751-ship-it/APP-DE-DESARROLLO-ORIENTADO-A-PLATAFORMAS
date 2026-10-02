import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryService } from '../../../app/core/services/delivery.service';
import { EcoPointService } from '../../../app/core/services/ecopoint.service';
import { MaterialService } from '../../../app/core/services/material.service';
import { EcoPoint } from '../../../app/core/models/ecopoint.model';
import { Material } from '../../../app/core/models/material.model';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="deliveries-container">
      <div class="form-card">
        <h2>📦 Registrar Entrega de Reciclaje</h2>
        <p>Ingresa el ecopunto y los materiales a entregar para sumar EcoPuntos</p>

        <div *ngIf="successMessage" class="alert-success">
          ✅ {{ successMessage }}
        </div>
        <div *ngIf="errorMessage" class="alert-error">
          ⚠️ {{ errorMessage }}
        </div>

        <form [formGroup]="deliveryForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="ecopoint_id">Seleccionar Ecopunto</label>
            <select id="ecopoint_id" formControlName="ecopoint_id">
              <option [value]="null" disabled>-- Selecciona un Ecopunto --</option>
              <option *ngFor="let ep of ecopoints" [value]="ep.id">
                📍 {{ ep.name }} ({{ ep.address }})
              </option>
            </select>
          </div>

          <div class="items-header">
            <h4>Materiales a Reciclar</h4>
            <button type="button" class="btn-add" (click)="addItem()">+ Agregar Material</button>
          </div>

          <div formArrayName="items" class="items-list">
            <div *ngFor="let item of items.controls; let i = index" [formGroupName]="i" class="item-row">
              <div class="field-material">
                <label>Material</label>
                <select formControlName="material_id">
                  <option [value]="null" disabled>Seleccionar...</option>
                  <option *ngFor="let mat of materials" [value]="mat.id">
                    {{ mat.name }} ({{ mat.points_per_kg }} pts/kg)
                  </option>
                </select>
              </div>

              <div class="field-weight">
                <label>Peso (Kg)</label>
                <input type="number" step="0.1" min="0.1" formControlName="weight_kg" placeholder="0.0" />
              </div>

              <button type="button" class="btn-remove" (click)="removeItem(i)" *ngIf="items.length > 1">
                🗑️
              </button>
            </div>
          </div>

          <button type="submit" class="btn-submit" [disabled]="deliveryForm.invalid || isLoading">
            <span *ngIf="!isLoading">Enviar Entrega para Validación</span>
            <span *ngIf="isLoading">Enviando entrega...</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .deliveries-container {
      max-width: 680px;
      margin: 32px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .form-card {
      background: white;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }

    h2 { color: #1b4332; margin-top: 0; }
    p { color: #64748b; margin-bottom: 24px; }

    .alert-success { background: #dcfce7; color: #15803d; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
    .alert-error { background: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 6px; margin-bottom: 16px; }

    .form-group { margin-bottom: 20px; }
    label { display: block; font-weight: 600; margin-bottom: 6px; color: #334155; }
    select, input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-sizing: border-box;
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      margin-bottom: 12px;
    }

    .btn-add { background: #52b788; color: #1b4332; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; cursor: pointer; }

    .item-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      background: #f8fafc;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .field-material { flex: 2; }
    .field-weight { flex: 1; }

    .btn-remove { background: #fee2e2; border: 1px solid #fca5a5; padding: 10px; border-radius: 6px; cursor: pointer; }

    .btn-submit {
      width: 100%;
      background: #2d6a4f;
      color: white;
      border: none;
      padding: 14px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      margin-top: 20px;
    }
  `]
})
export class DeliveriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private deliveryService = inject(DeliveryService);
  private ecopointService = inject(EcoPointService);
  private materialService = inject(MaterialService);
  private router = inject(Router);

  ecopoints: EcoPoint[] = [];
  materials: Material[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  deliveryForm: FormGroup = this.fb.group({
    ecopoint_id: [null, [Validators.required]],
    items: this.fb.array([])
  });

  get items(): FormArray {
    return this.deliveryForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.addItem(); // add at least one material row
  }

  loadInitialData(): void {
    this.ecopointService.getAll().subscribe({ next: (res) => this.ecopoints = res });
    this.materialService.getAll().subscribe({ next: (res) => this.materials = res });
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      material_id: [null, [Validators.required]],
      weight_kg: [0.5, [Validators.required, Validators.min(0.1)]]
    });
    this.items.push(itemGroup);
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.deliveryForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.deliveryService.create(this.deliveryForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '¡Entrega registrada con éxito! En espera de validación.';
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'Error al registrar la entrega.';
      }
    });
  }
}
