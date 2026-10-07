import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-gestor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container fade-in">
      <div class="card form-card">
        <div class="fc-header">
          <h2>👷 Crear o Asignar Gestor de Punto</h2>
          <p>Registra un nuevo usuario con perfil Gestor de Punto para operar en los EcoPuntos de Pamplona</p>
        </div>

        <form [formGroup]="gestorForm" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="alert alert-success" *ngIf="successMessage()">
            ✅ {{ successMessage() }}
          </div>
          <div class="alert alert-error" *ngIf="errorMessage()">
            ⚠️ {{ errorMessage() }}
          </div>

          <div class="form-group">
            <label class="form-label" for="name">Nombre Completo *</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Ej. Carlos Mendoza"
              class="form-control"
              [class.invalid]="isFieldInvalid('name')"
            />
            <span *ngIf="isFieldInvalid('name')" class="field-error">
              El nombre debe tener al menos 2 caracteres.
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Correo Electrónico *</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="ejemplo@ecopuntos.com"
              class="form-control"
              [class.invalid]="isFieldInvalid('email')"
            />
            <span *ngIf="isFieldInvalid('email')" class="field-error">
              Ingresa un correo electrónico válido.
            </span>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="password">Contraseña *</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="Mínimo 6 caracteres"
                class="form-control"
                [class.invalid]="isFieldInvalid('password')"
              />
              <span *ngIf="isFieldInvalid('password')" class="field-error">
                Mínimo 6 caracteres.
              </span>
            </div>

            <div class="form-group">
              <label class="form-label" for="defaultCity">Ciudad / Sede</label>
              <input
                id="defaultCity"
                type="text"
                formControlName="defaultCity"
                placeholder="Pamplona"
                class="form-control"
              />
            </div>
          </div>

          <button type="submit" [disabled]="submitting()" class="btn btn-primary btn-full mt-4">
            <span *ngIf="!submitting()">✨ Registrar Gestor de Punto</span>
            <span *ngIf="submitting()">Registrando gestor...</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-card { max-width: 580px; margin: 0 auto; padding: 0; overflow: hidden; }
    .fc-header { background: linear-gradient(135deg, #1b4332, #2d6a4f); color: white; padding: 24px; }
    .fc-header h2 { margin: 0 0 4px 0; color: white; font-size: 1.3rem; }
    .fc-header p { margin: 0; color: white; opacity: 0.85; font-size: 0.9rem; }
    .modal-body { padding: 28px; }
    .btn-full { width: 100%; justify-content: center; padding: 13px; font-weight: 700; }
    .mt-4 { margin-top: 20px; }
  `]
})
export class AdminGestorComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  submitting = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  gestorForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    defaultCity: ['Pamplona']
  });

  isFieldInvalid(field: string): boolean {
    const control = this.gestorForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.gestorForm.invalid) {
      this.gestorForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.adminService.createGestor(this.gestorForm.value).subscribe({
      next: (res) => {
        this.successMessage.set(res.message || 'Gestor de punto registrado correctamente.');
        this.gestorForm.reset({ defaultCity: 'Pamplona' });
        this.submitting.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al procesar la solicitud.');
        this.submitting.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
