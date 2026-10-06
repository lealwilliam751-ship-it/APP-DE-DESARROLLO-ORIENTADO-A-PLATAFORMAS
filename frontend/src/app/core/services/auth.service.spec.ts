import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe iniciar sesión y guardar el token', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@ecopuntos.com',
      role: 'Ciudadano',
      default_city: 'Pamplona',
      total_points: 100,
      level: 'Semilla Verde'
    };
    const mockResponse = { token: 'jwt_token_123', user: mockUser };

    service.login('test@ecopuntos.com', 'password123').subscribe((res) => {
      expect(res.token).toBe('jwt_token_123');
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.currentUser()?.email).toBe('test@ecopuntos.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('debe cerrar sesión y borrar los datos locales', () => {
    localStorage.setItem('token', 'fake_token');
    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });
});
