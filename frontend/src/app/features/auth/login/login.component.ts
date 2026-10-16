import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <!-- Left panel -->
      <div class="auth-hero">
        <div class="hero-content">
          <div class="hero-logo">
            <div class="hero-logo-card">
              <img src="assets/logo.png" alt="EcoPuntos Pamplona" class="hero-logo-img">
            </div>
          </div>
          <h1>EcoPuntos<br><span>Pamplona</span></h1>
          <p>Recicla, gana puntos y cambia tu ciudad.<br>Únete al movimiento verde de Pamplona.</p>
        </div>
        <div class="hero-decoration"></div>
      </div>

      <!-- Right panel -->
      <div class="auth-panel">
        <div class="auth-card fade-in">
          <div class="auth-card-header">
            <h2>Iniciar Sesión</h2>
            <p>Bienvenido de nuevo a la plataforma</p>
          </div>

          <div class="alert alert-error" *ngIf="errorMessage">
            <i class="bi bi-exclamation-triangle-fill me-2"></i> {{ errorMessage }}
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
            <div class="form-group">
              <label class="form-label">Correo / Documento de identidad</label>
              <input
                class="form-control"
                type="text"
                formControlName="email"
                placeholder="ejemplo@correo.com o 1001"
                [class.invalid]="f['email'].invalid && f['email'].touched"
              />
              <span class="field-error" *ngIf="f['email'].invalid && f['email'].touched">
                Campo requerido
              </span>
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <div class="input-eye">
                <input
                  class="form-control"
                  [type]="showPass() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  [class.invalid]="f['password'].invalid && f['password'].touched"
                />
                <button type="button" class="eye-btn" (click)="showPass.set(!showPass())">
                  <i class="bi" [ngClass]="showPass() ? 'bi-eye-slash-fill' : 'bi-eye-fill'"></i>
                </button>
              </div>
              <span class="field-error" *ngIf="f['password'].invalid && f['password'].touched">
                Mínimo 6 caracteres
              </span>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              class="btn btn-primary btn-full btn-lg submit-btn"
              [disabled]="loginForm.invalid || isLoading"
            >
              <span *ngIf="!isLoading"><i class="bi bi-box-arrow-in-right me-2"></i>Ingresar a la plataforma</span>
              <span *ngIf="isLoading" class="loading-text">
                <span class="dot-spinner"></span> Verificando...
              </span>
            </button>
          </form>


          <!-- Guest Access Option -->
          <div class="guest-access">
            <a id="btn-guest-access" routerLink="/ecopoints" class="btn-guest">
              <i class="bi bi-eye me-2"></i>Explorar la plataforma como Invitado
            </a>
          </div>

          <div class="auth-footer">
            ¿No tienes cuenta? <a routerLink="/register">Regístrate gratis</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      display: flex;
      min-height: calc(100vh - 64px);
    }

    /* Hero panel */
    .auth-hero {
      flex: 1;
      background: linear-gradient(160deg, #0a2e1a 0%, #1b4332 50%, #2d6a4f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      position: relative;
      overflow: hidden;
    }
    .hero-content {
      position: relative;
      z-index: 1;
      color: white;
      max-width: 400px;
    }
    .hero-logo {
      margin-bottom: 24px;
    }
    .hero-logo-card {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 14px 22px;
      border-radius: 18px;
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .hero-logo-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
    }
    .hero-logo-img {
      width: 130px;
      height: auto;
      max-height: 110px;
      object-fit: contain;
      display: block;
    }
    .hero-content h1 {
      font-size: 3rem;
      font-weight: 900;
      color: white;
      line-height: 1.1;
      margin-bottom: 20px;
    }
    .hero-content h1 span {
      color: #74c69d;
      display: block;
    }
    .hero-content p {
      font-size: 1.05rem;
      color: rgba(255,255,255,0.75);
      line-height: 1.7;
      margin-bottom: 0;
    }
    .hero-decoration {
      position: absolute;
      bottom: -60px; right: -60px;
      width: 300px; height: 300px;
      background: rgba(82,183,136,0.08);
      border-radius: 50%;
    }

    /* Auth panel */
    .auth-panel {
      width: 480px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      background: #f8fafc;
      overflow-y: auto;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      background: white;
      border-radius: 18px;
      padding: 36px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .auth-card-header { margin-bottom: 28px; }
    .auth-card-header h2 {
      font-size: 1.6rem;
      font-weight: 800;
      color: #1b4332;
      margin-bottom: 4px;
    }
    .auth-card-header p { color: #64748b; font-size: 0.9rem; }

    /* Form */
    .form-group { margin-bottom: 20px; }
    .form-label {
      display: block;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
      font-size: 0.875rem;
    }
    .form-control {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.95rem;
      color: #0f172a;
      transition: border-color 0.2s, box-shadow 0.2s;
      font-family: inherit;
    }
    .form-control:focus {
      outline: none;
      border-color: #40916c;
      box-shadow: 0 0 0 3px rgba(64,145,108,0.12);
    }
    .form-control.invalid { border-color: #e63946; }
    .input-eye { position: relative; }
    .input-eye .form-control { padding-right: 44px; }
    .eye-btn {
      position: absolute; right: 10px; top: 50%;
      transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 1rem;
    }
    .field-error { display: block; color: #e63946; font-size: 0.78rem; margin-top: 4px; }

    .submit-btn {
      background: linear-gradient(135deg, #2d6a4f, #1b4332);
      color: white;
      width: 100%;
      justify-content: center;
      padding: 14px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(27,67,50,0.35);
    }
    .submit-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1b4332, #0a2e1a);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(27,67,50,0.4);
    }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .loading-text { display: flex; align-items: center; gap: 8px; }
    .dot-spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }


    /* Alert */
    .alert { padding: 11px 14px; border-radius: 8px; font-size: 0.88rem; font-weight: 500; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .alert-error { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

    /* Guest Access */
    .guest-access { margin-top: 16px; text-align: center; }
    .btn-guest {
      display: inline-block;
      width: 100%;
      padding: 10px 14px;
      background: #f0faf3;
      border: 1.5px dashed #74c69d;
      border-radius: 10px;
      color: #1b4332;
      font-size: 0.88rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .btn-guest:hover {
      background: #d8f3dc;
      border-color: #2d6a4f;
      transform: translateY(-1px);
    }

    /* Footer */
    .auth-footer { margin-top: 18px; text-align: center; font-size: 0.88rem; color: #64748b; }
    .auth-footer a { color: #2d6a4f; font-weight: 700; text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; }

    /* Responsive */
    @media (max-width: 900px) {
      .auth-layout { flex-direction: column; }
      .auth-hero { padding: 36px 20px; min-height: 200px; }
      .hero-content h1 { font-size: 2.2rem; }
      .auth-panel { width: 100%; padding: 24px 16px; }
    }
    @media (max-width: 580px) {
      .auth-card { padding: 24px 18px; }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';
  showPass = signal(false);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get f() { return this.loginForm.controls; }


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
        this.errorMessage = err.error?.detail || 'Credenciales incorrectas. Intenta de nuevo.';
      }
    });
  }
}
