import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RewardService } from '../../../app/core/services/reward.service';
import { AuthService } from '../../../app/core/services/auth.service';
import { Reward, RedeemedReward } from '../../../app/core/models/reward.model';

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rewards-container">
      <div class="header">
        <h2>🎁 Catálogo de Recompensas</h2>
        <p>Canjea tus EcoPuntos acumulados por increíbles premios y beneficios sostenibles</p>
      </div>

      <div *ngIf="message" class="alert-info">
        ℹ️ {{ message }}
      </div>

      <div class="rewards-grid">
        <div *ngFor="let r of rewards" class="reward-card">
          <div class="reward-icon">🎉</div>
          <h3>{{ r.name }}</h3>
          <p class="desc">{{ r.description }}</p>
          <div class="reward-meta">
            <span class="cost">⭐ {{ r.point_cost }} pts</span>
            <span class="stock">Stock: {{ r.stock < 0 ? 'Ilimitado' : r.stock }}</span>
          </div>
          <button class="btn-redeem" (click)="redeem(r)" [disabled]="isRedeeming">
            Canjear Premio
          </button>
        </div>
      </div>

      <div class="history-section" *ngIf="history.length > 0">
        <h3>📜 Mi Historial de Canjes</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Código Único</th>
              <th>Puntos Canjeados</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of history">
              <td><code class="code-pill">{{ h.redemption_code }}</code></td>
              <td>-{{ h.points_spent }} pts</td>
              <td>{{ h.redeemed_at | date:'medium' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .rewards-container { max-width: 1080px; margin: 24px auto; padding: 0 20px; font-family: system-ui, -apple-system, sans-serif; }
    .header h2 { color: #1b4332; margin-top: 0; }
    .header p { color: #64748b; margin-bottom: 24px; }
    .alert-info { background: #e0f2fe; color: #0369a1; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
    .rewards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .reward-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; }
    .reward-icon { font-size: 2.2rem; margin-bottom: 8px; }
    .reward-card h3 { color: #1b4332; margin: 0 0 8px 0; }
    .desc { color: #64748b; font-size: 0.9rem; flex-grow: 1; }
    .reward-meta { display: flex; justify-content: space-between; margin: 16px 0; font-size: 0.9rem; }
    .cost { color: #b45309; font-weight: 800; }
    .stock { color: #64748b; }
    .btn-redeem { background: #ffb703; color: #000; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .history-section { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .data-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .data-table th, .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: left; }
    .code-pill { background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
  `]
})
export class RewardsComponent implements OnInit {
  private rewardService = inject(RewardService);
  private authService = inject(AuthService);

  rewards: Reward[] = [];
  history: RedeemedReward[] = [];
  message = '';
  isRedeeming = false;

  ngOnInit(): void {
    this.loadRewards();
    this.loadHistory();
  }

  loadRewards(): void {
    this.rewardService.getAll().subscribe({ next: (res) => this.rewards = res });
  }

  loadHistory(): void {
    this.rewardService.getMyRedeemedHistory().subscribe({ next: (res) => this.history = res });
  }

  redeem(reward: Reward): void {
    this.isRedeeming = true;
    this.message = '';

    this.rewardService.redeem(reward.id).subscribe({
      next: (res) => {
        this.isRedeeming = false;
        this.message = `¡Canje exitoso! Tu código único es ${res.redemption_code}`;
        this.authService.getProfile().subscribe();
        this.loadHistory();
      },
      error: (err) => {
        this.isRedeeming = false;
        this.message = err.error?.detail || 'No se pudo realizar el canje. Verifica tu saldo de puntos.';
      }
    });
  }
}
