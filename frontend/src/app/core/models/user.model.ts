export type UserRole = 'Ciudadano' | 'Gestor_de_Punto' | 'Administrador';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  default_city: string;
  total_points: number;
  level: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  default_city?: string;
}
