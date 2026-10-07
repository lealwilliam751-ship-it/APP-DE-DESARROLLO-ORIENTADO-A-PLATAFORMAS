import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../core/services/delivery.service';
import { EcoPointService } from '../../core/services/ecopoint.service';
import { MaterialService } from '../../core/services/material.service';
import { AuthService } from '../../core/services/auth.service';
import { QrService } from '../../core/services/qr.service';
import { EcoPoint } from '../../core/models/ecopoint.model';
import { Material } from '../../core/models/material.model';
import { Delivery } from '../../core/models/delivery.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-deliveries',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container fade-in">
      
      <!-- GESTOR BANNER: Scanning Citizen Context -->
      <div *ngIf="isGestorOrAdmin() && targetCitizen() as citizen" class="citizen-banner card mb-6 fade-in">
        <div class="cb-content">
          <div class="cb-avatar">{{ citizen.name.charAt(0).toUpperCase() }}</div>
          <div class="cb-details">
            <span class="cb-tag">👤 Registrando Entrega Presencial para:</span>
            <h3 class="cb-name">{{ citizen.name }} <span class="cb-id">#{{ citizen.id }}</span></h3>
            <div class="cb-meta">
              <span>📧 {{ citizen.email }}</span> • 
              <span>🌱 {{ citizen.level || 'Semilla Verde' }}</span> • 
              <strong style="color: #b45309">⭐ {{ citizen.total_points }} Puntos</strong>
            </div>
          </div>
          <button class="btn btn-sm btn-secondary" (click)="clearSelectedCitizen()">
            ✕ Cambiar Ciudadano
          </button>
        </div>
      </div>

      <!-- SECTION 1: Form Card -->
      <div class="form-card card mb-6">
        <div class="fc-header" [class.gestor-header]="isGestorOrAdmin()">
          <h2>
            <ng-container *ngIf="isGestorOrAdmin()">⚖️ Registrar y Pesarlo en Báscula (Aprobación Inmediata)</ng-container>
            <ng-container *ngIf="!isGestorOrAdmin()">📋 Ticket de Pre-solicitud de Entrega (Opcional)</ng-container>
          </h2>
          <p *ngIf="isGestorOrAdmin()">
            Ingresa los kilos pesados en la báscula física. Al presionar Aprobar, los EcoPuntos se acreditarán al instante.
          </p>
          <p *ngIf="!isGestorOrAdmin()">
            Agiliza tu visita seleccionando el EcoPunto y estimando tus residuos para generar tu ticket de entrega.
          </p>
        </div>

        <div class="alert alert-success" *ngIf="successMessage()">
          ✅ {{ successMessage() }}
        </div>
        <div class="alert alert-error" *ngIf="errorMessage()">
          ⚠️ {{ errorMessage() }}
        </div>

        <form [formGroup]="deliveryForm" (ngSubmit)="onSubmit()">
          <!-- EcoPoint Selection -->
          <div class="form-group">
            <label class="form-label" for="ecopoint_id">📍 Seleccionar EcoPunto de Acopio *</label>
            <select id="ecopoint_id" formControlName="ecopoint_id" class="form-control">
              <option [value]="null" disabled>-- Selecciona un EcoPunto --</option>
              <option *ngFor="let ep of ecopoints()" [value]="ep.id">
                📍 {{ ep.name }} ({{ ep.address }})
              </option>
            </select>
          </div>

          <!-- Materials Section -->
          <div class="items-section-header">
            <h4>♻️ Materiales a Registrar *</h4>
            <button type="button" class="btn btn-primary btn-sm" (click)="addItem()">
              + Agregar Otro Material
            </button>
          </div>

          <div formArrayName="items" class="items-list">
            <div *ngFor="let item of items.controls; let i = index" [formGroupName]="i" class="item-row card">
              <div class="field-material">
                <label class="form-label">Tipo de Material</label>
                <select formControlName="material_id" class="form-control">
                  <option [value]="null" disabled>Seleccionar material...</option>
                  <option *ngFor="let mat of materials()" [value]="mat.id">
                    {{ mat.name }} ({{ mat.points_per_kg }} pts / kg)
                  </option>
                </select>
              </div>

              <div class="field-weight">
                <label class="form-label">Peso Real (Kg)</label>
                <input type="number" step="0.1" min="0.1" formControlName="weight_kg" placeholder="0.0" class="form-control" />
              </div>

              <button type="button" class="btn-remove" (click)="removeItem(i)" *ngIf="items.length > 1" title="Eliminar material">
                🗑️
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="submit-btn btn-full mt-4" [class.gestor-submit]="isGestorOrAdmin()" [disabled]="deliveryForm.invalid || isLoading()">
            <ng-container *ngIf="isGestorOrAdmin()">
              <span *ngIf="!isLoading()">✅ Aprobar Entrega y Acreditar Puntos de Inmediato</span>
              <span *ngIf="isLoading()">Procesando pesaje y acreditando...</span>
            </ng-container>

            <ng-container *ngIf="!isGestorOrAdmin()">
              <span *ngIf="!isLoading()">🚀 Crear Ticket de Pre-solicitud (⏳ Pendiente)</span>
              <span *ngIf="isLoading()">Generando ticket...</span>
            </ng-container>
          </button>
        </form>
      </div>

      <!-- SECTION 2: Gestor Pending Queue (Bandeja de Entregas Pendientes) -->
      <div class="card mb-6" *ngIf="isGestorOrAdmin()">
        <div class="section-header mb-4">
          <div>
            <h3 class="section-title">📥 Bandeja de Entregas Pendientes (Pre-solicitudes)</h3>
            <p style="color: #64748b; font-size: 0.88rem; margin-top: 2px;">
              Entregas pre-solicitadas por ciudadanos que requieren verificación y pesaje presencial
            </p>
          </div>
          <button class="btn btn-sm btn-secondary" (click)="loadPendingDeliveries()">
            🔄 Actualizar Bandeja
          </button>
        </div>

        <div class="spinner" *ngIf="loadingPending()"></div>

        <div class="empty-state" *ngIf="!loadingPending() && pendingDeliveries().length === 0">
          <div class="empty-icon">✅</div>
          <p>No hay pre-solicitudes pendientes por validar en este momento.</p>
        </div>

        <div class="table-responsive" *ngIf="!loadingPending() && pendingDeliveries().length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 70px;">ID</th>
                <th>Ciudadano</th>
                <th>EcoPunto</th>
                <th>Puntos Estimados</th>
                <th>Acciones de Verificación</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of pendingDeliveries()">
                <td><span class="id-badge">#{{ d.id }}</span></td>
                <td>
                  <strong>{{ d.citizen_name || 'Ciudadano' }}</strong>
                  <div style="font-size: 0.78rem; color: #64748b;">Usuario ID: #{{ d.user_id }}</div>
                </td>
                <td>📍 {{ d.ecopoint_name || 'EcoPunto Pamplona' }}</td>
                <td><strong style="color: #2d6a4f">+{{ d.total_points }} pts</strong> (🌱 {{ d.total_co2 }} kg CO₂)</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-success" (click)="approveDelivery(d.id)" [disabled]="processingAction() === d.id">
                      {{ processingAction() === d.id ? 'Aprobando...' : '✅ Aprobar Pesaje' }}
                    </button>
                    <button class="btn btn-sm btn-danger" (click)="rejectDelivery(d.id)" [disabled]="processingAction() === d.id">
                      ❌ Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION 3: Citizen Deliveries List & Live Status -->
      <div class="card" *ngIf="authService.currentUser()?.role === 'Ciudadano'">
        <div class="section-header mb-4">
          <div>
            <h3 class="section-title">📜 Mis Entregas y Puntos Acumulados</h3>
            <p style="color: #64748b; font-size: 0.88rem; margin-top: 2px;">
              Historial de tus entregas y estado de aprobación en los EcoPuntos
            </p>
          </div>
          <button class="btn btn-sm btn-secondary" (click)="loadMyDeliveries()">
            🔄 Actualizar Estado
          </button>
        </div>

        <div class="spinner" *ngIf="loadingDeliveries()"></div>

        <div class="empty-state" *ngIf="!loadingDeliveries() && myDeliveries().length === 0">
          <div class="empty-icon">📦</div>
          <p>Aún no tienes entregas registradas. Presenta tu Carnet QR en un EcoPunto o realiza una pre-solicitud arriba.</p>
        </div>

        <div class="table-responsive" *ngIf="!loadingDeliveries() && myDeliveries().length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 70px;">ID</th>
                <th>EcoPunto</th>
                <th>Puntos Acumulados</th>
                <th>CO₂ Evitado</th>
                <th>Estado de Validación</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of myDeliveries()">
                <td><span class="id-badge">#{{ d.id }}</span></td>
                <td>📍 <strong>{{ d.ecopoint_name || 'EcoPunto Pamplona' }}</strong></td>
                <td><strong style="color: #2d6a4f">+{{ d.total_points }} pts</strong></td>
                <td>🌱 {{ d.total_co2 }} kg</td>
                <td>
                  <span class="pill" [ngClass]="statusClass(d.status)">
                    {{ statusLabel(d.status) }}
                  </span>
                </td>
                <td style="color: #64748b; font-size: 0.85rem">{{ d.created_at | date:'dd/MM/yyyy, h:mm a' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .citizen-banner {
      background: linear-gradient(135deg, #e8f5e9 0%, #d8f3dc 100%);
      border: 2px solid #52b788;
      padding: 16px 20px;
    }
    .cb-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .cb-avatar {
      width: 48px; height: 48px;
      background: #1b4332;
      color: white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 700;
      flex-shrink: 0;
    }
    .cb-details { flex: 1; }
    .cb-tag { font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #2d6a4f; letter-spacing: 0.5px; }
    .cb-name { margin: 2px 0; color: #1b4332; font-size: 1.15rem; font-weight: 800; }
    .cb-id { font-size: 0.85rem; color: #52b788; font-weight: 600; }
    .cb-meta { font-size: 0.85rem; color: #334155; }

    .form-card { max-width: 760px; margin: 0 auto; padding: 32px; }
    .fc-header { margin-bottom: 24px; }
    .fc-header h2 { color: #1b4332; margin-bottom: 4px; font-size: 1.3rem; }
    .fc-header p { color: #64748b; font-size: 0.92rem; }

    .items-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 28px;
      margin-bottom: 14px;
    }
    .items-section-header h4 { color: #1b4332; font-size: 1rem; margin: 0; }

    .items-list { display: flex; flex-direction: column; gap: 12px; }
    .item-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      background: #f8fafc;
      padding: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: none;
    }

    .field-material { flex: 2; }
    .field-weight { flex: 1; }

    .btn-remove {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      width: 42px; height: 42px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s;
    }
    .btn-remove:hover { background: #fca5a5; color: white; }

    .submit-btn {
      background: linear-gradient(135deg, #1b4332, #2d6a4f);
      color: white;
      padding: 14px;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(27,67,50,0.3);
      transition: all 0.2s;
    }
    .submit-btn.gestor-submit {
      background: linear-gradient(135deg, #15803d, #22c55e);
      box-shadow: 0 4px 14px rgba(21,128,61,0.3);
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .section-header { display: flex; align-items: center; justify-content: space-between; }
    .section-title { color: #1b4332; font-size: 1.15rem; font-weight: 700; margin: 0; }
    
    .id-badge { background: #f1f5f9; color: #475569; padding: 2px 7px; border-radius: 5px; font-size: 0.78rem; font-weight: 700; }
    .btn-secondary { background: #e2e8f0; color: #334155; }
    .btn-success { background: #dcfce7; color: #15803d; border: 1px solid #b7e4c7; font-weight: 700; }
    .btn-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; font-weight: 700; }
    .btn-full { width: 100%; justify-content: center; }
    .action-buttons { display: flex; gap: 8px; }
    .mb-4 { margin-bottom: 16px; }
    .mb-6 { margin-bottom: 24px; }
    .mt-4 { margin-top: 20px; }

    .pill-yellow { background: #fef9c3; color: #a16207; border: 1px solid #fde047; }
    .pill-green  { background: #dcfce7; color: #15803d; border: 1px solid #b7e4c7; }
    .pill-red    { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

    @media (max-width: 540px) {
      .item-row { flex-direction: column; align-items: stretch; }
      .btn-remove { align-self: flex-end; width: 100%; margin-top: 6px; }
      .cb-content { flex-direction: column; text-align: center; }
    }
  `]
})
export class DeliveriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private deliveryService = inject(DeliveryService);
  private ecopointService = inject(EcoPointService);
  private materialService = inject(MaterialService);
  private qrService = inject(QrService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ecopoints = signal<EcoPoint[]>([]);
  materials = signal<Material[]>([]);
  myDeliveries = signal<Delivery[]>([]);
  pendingDeliveries = signal<Delivery[]>([]);
  targetCitizen = signal<User | null>(null);

  isLoading = signal<boolean>(false);
  loadingDeliveries = signal<boolean>(false);
  loadingPending = signal<boolean>(false);
  processingAction = signal<number | null>(null);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  deliveryForm: FormGroup = this.fb.group({
    ecopoint_id: [1, [Validators.required]],
    items: this.fb.array([])
  });

  get items(): FormArray {
    return this.deliveryForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.addItem();

    // Read query params for citizenId (passed from scanner)
    this.route.queryParams.subscribe(params => {
      if (params['citizenId']) {
        const citizenId = Number(params['citizenId']);
        this.loadTargetCitizen(citizenId);
      }
    });

    if (this.isGestorOrAdmin()) {
      this.loadPendingDeliveries();
    } else {
      this.loadMyDeliveries();
    }
  }

  isGestorOrAdmin(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === 'Gestor_de_Punto' || role === 'Administrador';
  }

  loadInitialData(): void {
    this.ecopointService.getAll().subscribe({
      next: (res) => {
        this.ecopoints.set(res || []);
        if (res && res.length > 0 && !this.deliveryForm.get('ecopoint_id')?.value) {
          this.deliveryForm.patchValue({ ecopoint_id: res[0].id });
        }
        this.cdr.detectChanges();
      }
    });

    this.materialService.getAll().subscribe({
      next: (res) => {
        this.materials.set(res || []);
        this.cdr.detectChanges();
      }
    });
  }

  loadTargetCitizen(citizenId: number): void {
    this.qrService.getCitizenById(citizenId).subscribe({
      next: (res) => {
        if (res && res.citizen) {
          this.targetCitizen.set(res.citizen);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar la información del ciudadano.');
        this.cdr.detectChanges();
      }
    });
  }

  clearSelectedCitizen(): void {
    this.targetCitizen.set(null);
    this.router.navigate([], { queryParams: { citizenId: null }, queryParamsHandling: 'merge' });
  }

  loadPendingDeliveries(): void {
    if (!this.isGestorOrAdmin()) return;
    this.loadingPending.set(true);
    this.deliveryService.getPendingDeliveries().subscribe({
      next: (res) => {
        this.pendingDeliveries.set(res || []);
        this.loadingPending.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendingDeliveries.set([]);
        this.loadingPending.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  loadMyDeliveries(): void {
    if (this.authService.currentUser()?.role !== 'Ciudadano') return;

    this.loadingDeliveries.set(true);
    this.deliveryService.getMyDeliveries().subscribe({
      next: (res) => {
        this.myDeliveries.set(res || []);
        this.loadingDeliveries.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.myDeliveries.set([]);
        this.loadingDeliveries.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      material_id: [null, [Validators.required]],
      weight_kg: [1.0, [Validators.required, Validators.min(0.1)]]
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

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload: any = {
      ecopoint_id: Number(this.deliveryForm.value.ecopoint_id),
      items: this.deliveryForm.value.items.map((i: any) => ({
        material_id: Number(i.material_id),
        weight_kg: Number(i.weight_kg)
      }))
    };

    if (this.isGestorOrAdmin()) {
      payload.auto_approve = true;
      if (this.targetCitizen()) {
        payload.citizen_id = this.targetCitizen()?.id;
      }
    }

    this.deliveryService.create(payload).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        const citizenName = this.targetCitizen()?.name || 'Ciudadano';

        if (this.isGestorOrAdmin()) {
          this.successMessage.set(`¡Entrega aprobada exitosamente! Se han acreditado +${res.delivery?.total_points || 0} EcoPuntos a ${citizenName}.`);
          this.loadPendingDeliveries();
        } else {
          this.successMessage.set('¡Ticket de pre-entrega creado con éxito! Presenta tu carnet QR en el EcoPunto para ser verificado.');
          this.loadMyDeliveries();
        }

        // Reset items to 1 empty item
        this.items.clear();
        this.addItem();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al registrar la entrega.');
        this.cdr.detectChanges();
      }
    });
  }

  approveDelivery(deliveryId: number): void {
    this.processingAction.set(deliveryId);
    this.deliveryService.approve(deliveryId).subscribe({
      next: () => {
        this.processingAction.set(null);
        this.successMessage.set(`¡Entrega #${deliveryId} aprobada! Puntos acreditados.`);
        this.loadPendingDeliveries();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.processingAction.set(null);
        this.errorMessage.set(err.error?.detail || 'Error al aprobar la entrega.');
        this.cdr.detectChanges();
      }
    });
  }

  rejectDelivery(deliveryId: number): void {
    this.processingAction.set(deliveryId);
    this.deliveryService.reject(deliveryId).subscribe({
      next: () => {
        this.processingAction.set(null);
        this.successMessage.set(`Entrega #${deliveryId} fue rechazada.`);
        this.loadPendingDeliveries();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.processingAction.set(null);
        this.errorMessage.set(err.error?.detail || 'Error al rechazar la entrega.');
        this.cdr.detectChanges();
      }
    });
  }

  statusLabel(status: string): string {
    if (status === 'pending') return '⏳ Pendiente de Aprobación';
    if (status === 'approved') return '✅ Aprobada (+Puntos Acreditados)';
    if (status === 'rejected') return '❌ Rechazada';
    return status;
  }

  statusClass(status: string): string {
    if (status === 'pending') return 'pill-yellow';
    if (status === 'approved') return 'pill-green';
    if (status === 'rejected') return 'pill-red';
    return '';
  }
}
