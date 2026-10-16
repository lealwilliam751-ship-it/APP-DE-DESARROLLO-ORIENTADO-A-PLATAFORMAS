import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RankingService } from '../../core/services/ranking.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container fade-in">
      <div class="page-header">
        <div>
          <h2><i class="bi bi-trophy-fill text-warning me-2"></i> Ranking de Ciudadanos Ecológicos</h2>
          <p style="color: #64748b; font-size: 0.95rem;">Los recicladores con mayor impacto ambiental en Pamplona</p>
        </div>
      </div>

      <!-- Loading spinner -->
      <div class="spinner" *ngIf="loading()"></div>

      <!-- Empty state -->
      <div class="card empty-state" *ngIf="!loading() && topUsers().length === 0">
        <div class="empty-icon"><i class="bi bi-trophy text-muted"></i></div>
        <p>Aún no hay posiciones registradas en el ranking.</p>
      </div>

      <!-- Ranking Table Card -->
      <div class="card" *ngIf="!loading() && topUsers().length > 0">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 100px;">Posición</th>
                <th>Ciudadano</th>
                <th>Nivel</th>
                <th style="text-align: right;">Puntos Acumulados</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of topUsers(); let i = index" [class.top-three]="i < 3">
                <td class="pos-cell">
                  <span class="medal-badge gold" *ngIf="i === 0"><i class="bi bi-award-fill" style="color: #eab308"></i> 1°</span>
                  <span class="medal-badge silver" *ngIf="i === 1"><i class="bi bi-award-fill" style="color: #94a3b8"></i> 2°</span>
                  <span class="medal-badge bronze" *ngIf="i === 2"><i class="bi bi-award-fill" style="color: #b45309"></i> 3°</span>
                  <span class="rank-num" *ngIf="i >= 3">#{{ i + 1 }}</span>
                </td>
                <td class="name-cell">
                  <div class="user-cell">
                    <div class="user-avatar-sm">{{ u.name.charAt(0).toUpperCase() }}</div>
                    <span class="user-name-txt">{{ u.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="level-badge"><i class="bi bi-leaf-fill text-success me-1"></i> {{ u.level || 'Semilla Verde' }}</span>
                </td>
                <td class="points-cell">
                  <strong><i class="bi bi-star-fill text-warning me-1"></i> {{ u.total_points | number }} pts</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-table th { background: #f8fafc; font-size: 0.78rem; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    .top-three { background-color: #f0faf3; }
    .pos-cell { font-weight: 800; font-size: 1rem; }
    
    .medal-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 0.85rem;
    }
    .medal-badge.gold   { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
    .medal-badge.silver { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
    .medal-badge.bronze { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
    .rank-num { font-weight: 700; color: #64748b; font-size: 0.9rem; padding-left: 8px; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-avatar-sm {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #52b788, #1b4332);
      color: white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
    }
    .user-name-txt { font-weight: 600; color: #0f172a; font-size: 0.95rem; }

    .level-badge {
      background: #d8f3dc;
      color: #1b4332;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .points-cell { text-align: right; color: #b45309; font-size: 1rem; }
  `]
})
export class RankingComponent implements OnInit {
  private rankingService = inject(RankingService);
  private cdr = inject(ChangeDetectorRef);

  topUsers = signal<User[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadRanking();
  }

  loadRanking(): void {
    this.loading.set(true);
    this.rankingService.getTopRanking().subscribe({
      next: (res) => {
        this.topUsers.set(res || []);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.topUsers.set([]);
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
