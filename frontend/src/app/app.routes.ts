import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DeliveriesComponent } from './features/deliveries/deliveries.component';
import { EcopointsComponent } from './features/ecopoints/ecopoints.component';
import { RewardsComponent } from './features/rewards/rewards.component';
import { RankingComponent } from './features/ranking/ranking.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'deliveries', component: DeliveriesComponent, canActivate: [authGuard] },
  { path: 'ecopoints', component: EcopointsComponent },
  { path: 'rewards', component: RewardsComponent },
  { path: 'ranking', component: RankingComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
