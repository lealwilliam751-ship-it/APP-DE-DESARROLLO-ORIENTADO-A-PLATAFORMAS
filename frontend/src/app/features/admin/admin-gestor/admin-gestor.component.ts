import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-gestor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-gestor-container">
      <div class="card">
        <div class="card-header">
          <h2>👨‍🏭 Crear / Asignar Gestor de Punto</h2>
          <p>Registra un nuevo usuario con perfil Gestor de Punto o actualiza un usuario existente para operar ecopuntos.</p>
        </div>

        <form [formGroup]="gestorForm" (ngSubmit)="onSubmit()" class="gestor-form">
          <div *ngIf="successMessage" class="alert success">
            ✅ {{ successMessage }}
          </div>
          <div *ngIf="errorMessage" class="alert error">
            ⚠️ {{ errorMessage }}
          </div>

          <div class="form-group">
            <label for="name">Nombre Completo *</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Ej. Carlos Mendoza"
              [class.invalid]="isFieldInvalid('name')"
            />
            <span *ngIf="isFieldInvalid('name')" class="field-error">
              El nombre debe tener al menos 2 caracteres.
            </span>
          </div>

          <div class="form-group">
            <label for="email">Correo Electrónico *</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="ejemplo@ecopuntos.com"
              [class.invalid]="isFieldInvalid('email')"
            />
            <span *ngIf="isFieldInvalid('email')" class="field-error">
              Ingresa un correo electrónico válido.
            </span>
          </div>

          <div class="form-group">
            <label for="password">Contraseña *</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Mínimo 6 caracteres"
              [class.invalid]="isFieldInvalid('password')"
            />
            <span *ngIf="isFieldInvalid('password')" class="field-error">
              La contraseña debe tener al menos 6 caracteres.
            </span>
          </div>

          <div class="form-group">
            <label for="defaultCity">Ciudad / Sede</label>
            <input
              id="defaultCity"
              type="text"
              formControlName="defaultCity"
              placeholder="Pamplona"
            />
          </div>

          <button type="submit" [disabled]="submitting" class="btn-submit">
            <span *ngIf="!submitting">Guardar y Crear Gestor</span>
            <span *ngIf="submitting">Guardando...</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .admin-gestor-container {
      max-width: 600px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .card-header {
      background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
      color: white;
      padding: 24px;
    }
    .card-header h2 {
      margin: 0 0 6px 0;
      font-size: 1.4rem;
    }
    .card-header p {
      margin: 0;
      font-size: 0.88rem;
      opacity: 0.9;
    }
    .gestor-form {
      padding: 24px;
    }
    .form-group {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
    }
    label {
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 6px;
      color: #2b2b2b;
    }
    input {
      padding: 10px 14px;
      border: 1.5px solid #ccc;
      border-radius: 6px;
      font-size: 0.95rem;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: #2d6a4f;
      outline: none;
    }
    input.invalid {
      border-color: #e63946;
      background-color: #fff0f3;
    }
    .field-error {
      color: #e63946;
      font-size: 0.8rem;
      margin-top: 4px;
    }
    .btn-submit {
      width: 100%;
      background-color: #2d6a4f;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .btn-submit:hover:not(:disabled) {
      background-color: #1b4332;
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .alert {
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 0.9rem;
    }
    .alert.success {
      background-color: #d8f3dc;
      color: #1b4332;
    }
    .alert.error {
      background-color: #ffddd2;
      color: #c1121f;
    }
  `]
})
export class AdminGestorComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);

  gestorForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    defaultCity: ['Pamplona']
  });

  submitting = false;
  successMessage = '';
  errorMessage = '';

  isFieldInvalid(field: string): boolean {
    const control = this.gestorForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.gestorForm.invalid) {
      this.gestorForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.adminService.createGestor(this.gestorForm.value).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Gestor de punto registrado correctamente.';
        this.gestorForm.reset({ defaultCity: 'Pamplona' });
        this.submitting = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Error al procesar la solicitud.';
        this.submitting = false;
      }
    });
  }
}
