import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RankingService } from '../../../app/core/services/ranking.service';
import { User } from '../../../app/core/models/user.model';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ranking-container">
      <div class="header">
        <h2>🏆 Ranking de Ciudadanos Ecológicos</h2>
        <p>Los recicladores con mayor impacto ambiental en Pamplona</p>
      </div>

      <div class="ranking-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Posición</th>
              <th>Ciudadano</th>
              <th>Nivel</th>
              <th>Puntos Acumulados</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of topUsers; let i = index" [class.top-three]="i < 3">
              <td class="pos-cell">
                <span *ngIf="i === 0">🥇 1°</span>
                <span *ngIf="i === 1">🥈 2°</span>
                <span *ngIf="i === 2">🥉 3°</span>
                <span *ngIf="i >= 3">#{{ i + 1 }}</span>
              </td>
              <td class="name-cell">{{ u.name }}</td>
              <td><span class="level-badge">{{ u.level }}</span></td>
              <td class="points-cell">⭐ {{ u.total_points }} pts</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .ranking-container { max-width: 800px; margin: 24px auto; padding: 0 20px; font-family: system-ui, -apple-system, sans-serif; }
    .header h2 { color: #1b4332; margin-top: 0; }
    .header p { color: #64748b; margin-bottom: 24px; }
    .ranking-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #f1f5f9; }
    .data-table th { background: #f8fafc; color: #475569; font-size: 0.85rem; text-transform: uppercase; }
    .top-three { background-color: #f0fdf4; }
    .pos-cell { font-weight: 800; font-size: 1.1rem; }
    .name-cell { font-weight: 600; color: #1e293b; }
    .level-badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; }
    .points-cell { font-weight: 800; color: #b45309; }
  `]
})
export class RankingComponent implements OnInit {
  private rankingService = inject(RankingService);
  topUsers: User[] = [];

  ngOnInit(): void {
    this.rankingService.getTopRanking().subscribe({
      next: (res) => this.topUsers = res,
      error: () => this.topUsers = []
    });
  }
}
