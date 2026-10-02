import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRoles: string[] = route.data['roles'] || [];

  const currentUser = authService.currentUser();
  if (currentUser && expectedRoles.includes(currentUser.role)) {
    return true;
  }

  alert('Acceso restringido para tu rol de usuario.');
  router.navigate(['/']);
  return false;
};
