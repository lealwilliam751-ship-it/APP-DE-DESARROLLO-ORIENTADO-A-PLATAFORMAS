import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.post<Delivery>(this.apiUrl, data);
  }

  approve(id: number): Observable<Delivery> {
    return this.http.patch<Delivery>(`${this.apiUrl}/${id}/approve`, {});
  }

  reject(id: number): Observable<Delivery> {
    return this.http.patch<Delivery>(`${this.apiUrl}/${id}/reject`, {});
  }

  cancel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
