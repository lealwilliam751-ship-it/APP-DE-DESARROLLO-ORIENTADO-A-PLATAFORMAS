import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AdminMetrics {
  totalUsers: number;
  totalDeliveries: number;
  totalPoints: number;
  totalCo2: number;
}

export interface CreateGestorDTO {
  name: string;
  email: string;
  password: string;
  defaultCity?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  createGestor(data: CreateGestorDTO): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-gestor`, data);
  }

  getMetrics(): Observable<AdminMetrics> {
    return this.http.get<any>(`${this.apiUrl}/metrics`).pipe(
      map(res => res.metrics || res)
    );
  }
}
