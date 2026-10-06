import { TestBed } from '@angular/core';
import { Router } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    spyOn(window, 'alert');

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('debe permitir acceso si el rol del usuario coincide con la ruta', () => {
    authServiceSpy.currentUser.and.returnValue({
      id: 1,
      name: 'Admin User',
      email: 'admin@ecopuntos.com',
      role: 'Administrador',
      default_city: 'Pamplona',
      total_points: 0,
      level: 'Admin'
    });

    const routeMock = { data: { roles: ['Administrador'] } } as any;

    const result = TestBed.runInInjectionContext(() => roleGuard(routeMock, {} as any));
    expect(result).toBeTrue();
  });

  it('debe denegar acceso si el rol no coincide con la ruta', () => {
    authServiceSpy.currentUser.and.returnValue({
      id: 2,
      name: 'Ciudadano User',
      email: 'user@ecopuntos.com',
      role: 'Ciudadano',
      default_city: 'Pamplona',
      total_points: 10,
      level: 'Semilla'
    });

    const routeMock = { data: { roles: ['Administrador'] } } as any;

    const result = TestBed.runInInjectionContext(() => roleGuard(routeMock, {} as any));
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});
