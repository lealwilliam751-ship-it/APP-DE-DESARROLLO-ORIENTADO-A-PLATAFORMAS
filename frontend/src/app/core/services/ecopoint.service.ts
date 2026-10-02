import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EcoPoint, EcoPointCreateDTO } from '../models/ecopoint.model';

@Injectable({
  providedIn: 'root'
})
export class EcoPointService {
  private apiUrl = `${environment.apiUrl}/ecopoints`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<EcoPoint[]> {
    return this.http.get<EcoPoint[]>(this.apiUrl);
  }

  getById(id: number): Observable<EcoPoint> {
    return this.http.get<EcoPoint>(`${this.apiUrl}/${id}`);
  }

  getNearby(lat: number, lng: number, radiusKm: number = 5): Observable<EcoPoint[]> {
    return this.http.get<EcoPoint[]>(`${this.apiUrl}/nearby`, {
      params: { lat, lng, radius_km: radiusKm }
    });
  }

  create(data: EcoPointCreateDTO): Observable<EcoPoint> {
    return this.http.post<EcoPoint>(this.apiUrl, data);
  }

  update(id: number, data: Partial<EcoPointCreateDTO>): Observable<EcoPoint> {
    return this.http.put<EcoPoint>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
