import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RewardService } from '../../core/services/reward.service';
import { AuthService } from '../../core/services/auth.service';
import { Reward, RedeemedReward } from '../../core/models/reward.model';

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container fade-in">
      <div class="page-header">
        <div>
          <h2><i class="bi bi-gift-fill text-primary me-2"></i> Catálogo de Recompensas</h2>
          <p style="color: #64748b; font-size: 0.95rem;">Canjea tus EcoPuntos acumulados por increíbles premios y beneficios sostenibles</p>
        </div>
      </div>

      <!-- User balance notice -->
      <div class="card balance-card mb-6" *ngIf="authService.currentUser() as user">
        <div class="bc-left">
          <span class="bc-icon"><i class="bi bi-star-fill text-warning"></i></span>
          <div>
            <div class="bc-title">Tus EcoPuntos Disponibles</div>
            <div class="bc-points">{{ user.total_points | number }} pts</div>
          </div>
        </div>
        <div class="bc-badge"><i class="bi bi-leaf-fill me-1"></i> {{ user.level || 'Semilla Verde' }}</div>
      </div>

      <!-- System message -->
      <div class="alert alert-info" *ngIf="message()">
         <i class="bi bi-info-circle-fill me-1"></i> {{ message() }}
      </div>

      <!-- Loading spinner -->
      <div class="spinner" *ngIf="loading()"></div>

      <!-- Empty state -->
      <div class="card empty-state" *ngIf="!loading() && rewards().length === 0">
        <div class="empty-icon"><i class="bi bi-gift text-muted"></i></div>
        <p>No hay premios disponibles en este momento.</p>
      </div>

      <!-- Rewards Grid -->
      <div class="grid-3 mb-6" *ngIf="!loading() && rewards().length > 0">
        <div *ngFor="let r of rewards()" class="reward-card card">
          <div class="rc-header">
            <span class="category-badge">{{ r.category || 'General' }}</span>
            <span class="stock-badge" [class.out]="r.stock === 0">
              {{ r.stock < 0 ? 'Ilimitado' : (r.stock === 0 ? 'Agotado' : 'Stock: ' + r.stock) }}
            </span>
          </div>

          <div class="rc-body">
            <div class="rc-icon"><i class="bi bi-gift-fill text-primary"></i></div>
            <h3 class="rc-title">{{ r.name }}</h3>
            <p class="rc-desc">{{ r.description }}</p>
          </div>

          <div class="rc-footer">
            <div class="rc-cost">
              <span class="cost-label">Costo:</span>
              <strong class="cost-val"><i class="bi bi-star-fill text-warning me-1"></i> {{ r.point_cost }} pts</strong>
            </div>

            <button
              class="btn btn-warning btn-full"
              (click)="redeem(r)"
              [disabled]="isRedeeming() || r.stock === 0 || (authService.currentUser()?.total_points || 0) < r.point_cost"
            >
              {{ r.stock === 0 ? 'Agotado' : ((authService.currentUser()?.total_points || 0) < r.point_cost ? 'Puntos insuficientes' : 'Canjear Premio') }}
            </button>
          </div>
        </div>
      </div>

      <!-- History Table -->
      <div class="card" *ngIf="history().length > 0">
        <h3 style="color: #1b4332; margin-bottom: 16px;"><i class="bi bi-journal-text text-success me-2"></i> Mi Historial de Canjes</h3>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código Único</th>
                <th>Puntos Canjeados</th>
                <th>Fecha de Canje</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of history()">
                <td><code class="code-pill">{{ h.redemption_code }}</code></td>
                <td><strong style="color: #b91c1c">-{{ h.points_spent }} pts</strong></td>
                <td style="color: #64748b; font-size: 0.85rem">{{ h.redeemed_at | date:'dd/MM/yyyy, h:mm a' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mb-6 { margin-bottom: 24px; }
    .balance-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #f0faf3, #d8f3dc);
      border: 1px solid #b7e4c7;
      padding: 16px 24px;
    }
    .bc-left { display: flex; align-items: center; gap: 14px; }
    .bc-icon { font-size: 2rem; }
    .bc-title { font-size: 0.82rem; color: #1b4332; font-weight: 600; text-transform: uppercase; }
    .bc-points { font-size: 1.6rem; font-weight: 800; color: #0a2e1a; line-height: 1; }
    .bc-badge { background: #1b4332; color: #74c69d; font-weight: 700; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; }

    .reward-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      gap: 16px;
    }
    .rc-header { display: flex; justify-content: space-between; align-items: center; }
    .category-badge { background: #e0f2fe; color: #0369a1; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
    .stock-badge { background: #f1f5f9; color: #475569; font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
    .stock-badge.out { background: #fee2e2; color: #b91c1c; }

    .rc-body { display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .rc-icon { font-size: 2rem; }
    .rc-title { font-size: 1.15rem; color: #1b4332; font-weight: 700; margin: 0; }
    .rc-desc { color: #64748b; font-size: 0.9rem; line-height: 1.4; margin: 0; }

    .rc-footer { display: flex; flex-direction: column; gap: 12px; margin-top: auto; }
    .rc-cost { display: flex; align-items: center; justify-content: space-between; background: #fffbeb; border: 1px solid #fde047; padding: 8px 12px; border-radius: 8px; }
    .cost-label { font-size: 0.8rem; color: #a16207; font-weight: 600; }
    .cost-val { color: #b45309; font-size: 1.05rem; }

    .btn-warning { background: #ffb703; color: #0f172a; font-weight: 700; border: none; }
    .btn-warning:hover:not(:disabled) { background: #fbbf24; }
    .btn-full { width: 100%; justify-content: center; padding: 12px; }

    .code-pill { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 0.88rem; font-weight: 700; color: #0f172a; }

    @media (max-width: 600px) {
      .balance-card { flex-direction: column; align-items: flex-start; gap: 12px; }
    }
  `]
})
export class RewardsComponent implements OnInit {
  rewardService = inject(RewardService);
  authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  rewards = signal<Reward[]>([]);
  history = signal<RedeemedReward[]>([]);
  loading = signal<boolean>(true);
  isRedeeming = signal<boolean>(false);
  message = signal<string>('');

  ngOnInit(): void {
    this.loadRewards();
    this.loadHistory();
  }

  loadRewards(): void {
    this.loading.set(true);
    this.rewardService.getAll().subscribe({
      next: (res) => {
        this.rewards.set(res || []);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.rewards.set([]);
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  loadHistory(): void {
    this.rewardService.getMyRedeemedHistory().subscribe({
      next: (res) => {
        this.history.set(res || []);
        this.cdr.detectChanges();
      },
      error: () => {
        this.history.set([]);
        this.cdr.detectChanges();
      }
    });
  }

  redeem(reward: Reward): void {
    this.isRedeeming.set(true);
    this.message.set('');

    this.rewardService.redeem(reward.id).subscribe({
      next: (res) => {
        this.isRedeeming.set(false);
        this.message.set(`¡Canje exitoso! Tu código de beneficio es: ${res.redemption_code || 'CONFIRMED'}`);
        this.authService.getProfile().subscribe(() => this.cdr.detectChanges());
        this.loadHistory();
        this.loadRewards();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isRedeeming.set(false);
        this.message.set(err.error?.detail || 'No se pudo realizar el canje. Verifica tus puntos disponibles.');
        this.cdr.detectChanges();
      }
    });
  }
}
