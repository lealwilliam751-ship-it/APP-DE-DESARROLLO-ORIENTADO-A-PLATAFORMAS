import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DeliveriesComponent } from './features/deliveries/deliveries.component';
import { EcopointsComponent } from './features/ecopoints/ecopoints.component';
import { EcopointDetailComponent } from './features/ecopoints/ecopoint-detail/ecopoint-detail.component';
import { RewardsComponent } from './features/rewards/rewards.component';
import { RankingComponent } from './features/ranking/ranking.component';
import { AdminMetricsComponent } from './features/admin/admin-metrics/admin-metrics.component';
import { AdminGestorComponent } from './features/admin/admin-gestor/admin-gestor.component';
import { AdminEcopointsComponent } from './features/admin/admin-ecopoints/admin-ecopoints.component';
import { AdminMaterialsComponent } from './features/admin/admin-materials/admin-materials.component';
import { AdminRewardsComponent } from './features/admin/admin-rewards/admin-rewards.component';
import { GestorScanComponent } from './features/gestor/gestor-scan/gestor-scan.component';
import { CitizenQrComponent } from './features/citizen/citizen-qr/citizen-qr.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'deliveries', component: DeliveriesComponent, canActivate: [authGuard] },
  { path: 'ecopoints', component: EcopointsComponent },
  { path: 'ecopoints/:id', component: EcopointDetailComponent },
  { path: 'rewards', component: RewardsComponent },
  { path: 'ranking', component: RankingComponent },

  // Rutas protegidas por Rol de Administrador
  {
    path: 'admin/metrics',
    component: AdminMetricsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'] }
  },
  {
    path: 'admin/gestores',
    component: AdminGestorComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'] }
  },
  {
    path: 'admin/ecopoints',
    component: AdminEcopointsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'] }
  },
  {
    path: 'admin/materials',
    component: AdminMaterialsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'] }
  },
  {
    path: 'admin/rewards',
    component: AdminRewardsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'] }
  },

  // Rutas protegidas por Rol de Gestor de Punto
  {
    path: 'gestor/scan',
    component: GestorScanComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Gestor_de_Punto', 'Administrador'] }
  },

  // Rutas de Ciudadano
  {
    path: 'ciudadano/qr',
    component: CitizenQrComponent,
    canActivate: [authGuard]
  },

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
