import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Delivery, CreateDeliveryDTO } from '../models/delivery.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = `${environment.apiUrl}/deliveries`;

  constructor(private http: HttpClient) {}

  getMyDeliveries(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.apiUrl}/my`);
  }

  getPendingDeliveries(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.apiUrl}/pending`);
  }

  create(data: CreateDeliveryDTO): Observable<Delivery> {
    return this.http.post<{ delivery: Delivery }>(this.apiUrl, data).pipe(
      map(res => res.delivery)
    );
  }

  approve(id: number): Observable<Delivery> {
    return this.http.patch<{ result: any; delivery: Delivery }>(`${this.apiUrl}/${id}/approve`, {}).pipe(
      map(res => res.delivery)
    );
  }

  reject(id: number): Observable<Delivery> {
    return this.http.patch<{ delivery: Delivery }>(`${this.apiUrl}/${id}/reject`, {}).pipe(
      map(res => res.delivery)
    );
  }

  cancel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
