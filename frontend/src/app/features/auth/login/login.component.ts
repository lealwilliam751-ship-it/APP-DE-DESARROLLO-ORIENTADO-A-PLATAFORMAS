import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>🌱 Iniciar Sesión</h2>
          <p>Bienvenido de nuevo a EcoPuntos Pamplona</p>
        </div>

        <div *ngIf="errorMessage" class="alert-error">
          ⚠️ {{ errorMessage }}
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Correo Electrónico o Documento</label>
            <input
              id="email"
              type="text"
              formControlName="email"
              placeholder="ejemplo@ecopuntos.co o 1001"
              [class.invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
            />
            <small *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="error-text">
              Ingresa tu usuario o correo institucional.
            </small>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              [class.invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
            />
            <small *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="error-text">
              La contraseña debe tener al menos 6 caracteres.
            </small>
          </div>

          <button type="submit" class="btn-submit" [disabled]="loginForm.invalid || isLoading">
            <span *ngIf="!isLoading">Ingresar a la Plataforma</span>
            <span *ngIf="isLoading">Verificando credenciales...</span>
          </button>
        </form>

        <div class="test-users-section">
          <h4>Acceso Rápido (Usuarios de Prueba):</h4>
          <div class="test-buttons">
            <button class="btn-quick eco" (click)="fillDemo('1001', 'eco123')">👤 Ciudadano (1001)</button>
            <button class="btn-quick gestor" (click)="fillDemo('2002', 'gestor123')">🏢 Gestor (2002)</button>
            <button class="btn-quick admin" (click)="fillDemo('9001', 'admin123')">⚙️ Admin (9001)</button>
          </div>
        </div>

        <div class="auth-footer">
          ¿No tienes una cuenta aún? <a routerLink="/register">Regístrate aquí</a>
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
      max-width: 440px;
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
      margin-bottom: 18px;
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
      transition: border-color 0.2s;
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
      background: #2d6a4f;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 8px;
    }

    .btn-submit:hover:not(:disabled) {
      background: #1b4332;
    }

    .btn-submit:disabled {
      background: #a8dadc;
      cursor: not-allowed;
    }

    .test-users-section {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }

    .test-users-section h4 {
      font-size: 0.85rem;
      color: #555;
      margin: 0 0 10px 0;
    }

    .test-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-quick {
      flex: 1;
      border: 1px solid #ddd;
      background: #f8f9fa;
      padding: 6px 4px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-quick.eco:hover { background: #d8f3dc; border-color: #52b788; }
    .btn-quick.gestor:hover { background: #e0f2fe; border-color: #38bdf8; }
    .btn-quick.admin:hover { background: #fef3c7; border-color: #f59e0b; }

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
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  fillDemo(user: string, pass: string): void {
    this.loginForm.patchValue({ email: user, password: pass });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || err.error?.message || 'Error al autenticar usuario. Revisa tus datos.';
      }
    });
  }
}
