import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../app/core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>📝 Registro de Ciudadano</h2>
          <p>Únete a la comunidad ecológica de Pamplona</p>
        </div>

        <div *ngIf="errorMessage" class="alert-error">
          ⚠️ {{ errorMessage }}
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Nombre Completo</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Ej. Ana María García"
              [class.invalid]="registerForm.get('name')?.invalid && registerForm.get('name')?.touched"
            />
            <small *ngIf="registerForm.get('name')?.invalid && registerForm.get('name')?.touched" class="error-text">
              El nombre completo es obligatorio.
            </small>
          </div>

          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="correo@ejemplo.com"
              [class.invalid]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
            />
            <small *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" class="error-text">
              Ingresa un correo electrónico válido.
            </small>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              [class.invalid]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
            />
            <small *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" class="error-text">
              Mínimo 6 caracteres.
            </small>
          </div>

          <div class="form-group">
            <label for="default_city">Ciudad Principal</label>
            <input
              id="default_city"
              type="text"
              formControlName="default_city"
              placeholder="Pamplona"
            />
          </div>

          <button type="submit" class="btn-submit" [disabled]="registerForm.invalid || isLoading">
            <span *ngIf="!isLoading">Crear mi Cuenta de Ciudadano</span>
            <span *ngIf="isLoading">Creando cuenta...</span>
          </button>
        </form>

        <div class="auth-footer">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión aquí</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 80px);
      background-color: #f4f6f8;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .auth-card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border: 1px solid #e0e0e0;
    }

    .auth-header h2 {
      color: #1b4332;
      margin: 0 0 6px 0;
      font-size: 1.6rem;
    }

    .auth-header p {
      color: #666;
      font-size: 0.9rem;
      margin: 0 0 24px 0;
    }

    .alert-error {
      background-color: #ffe5e5;
      color: #c1121f;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid #ffb3b3;
      margin-bottom: 16px;
      font-size: 0.9rem;
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
      font-size: 0.9rem;
    }

    input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 0.95rem;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: #2d6a4f;
      box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.15);
    }

    input.invalid {
      border-color: #e63946;
    }

    .error-text {
      color: #e63946;
      font-size: 0.8rem;
      margin-top: 4px;
      display: block;
    }

    .btn-submit {
      width: 100%;
      background: #52b788;
      color: #1b4332;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 12px;
    }

    .btn-submit:hover:not(:disabled) {
      background: #40916c;
      color: white;
    }

    .btn-submit:disabled {
      background: #a8dadc;
      cursor: not-allowed;
    }

    .auth-footer {
      margin-top: 20px;
      text-align: center;
      font-size: 0.9rem;
      color: #666;
    }

    .auth-footer a {
      color: #2d6a4f;
      font-weight: 600;
      text-decoration: none;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  errorMessage = '';

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    default_city: ['Pamplona']
  });

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'Error al crear la cuenta. Intenta con otro correo.';
        this.cdr.detectChanges();
      }
    });
  }
}
