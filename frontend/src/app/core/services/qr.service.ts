import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

export interface QRGenerateResponse {
  qr: string;
  user: User;
}

export interface QRScanResponse {
  valid: boolean;
  citizen: User;
}

@Injectable({
  providedIn: 'root'
})
export class QrService {
  private apiUrl = `${environment.apiUrl}/qr`;

  constructor(private http: HttpClient) {}

  generate(): Observable<QRGenerateResponse> {
    return this.http.get<QRGenerateResponse>(`${this.apiUrl}/generate`);
  }

  scan(payload: string): Observable<QRScanResponse> {
    return this.http.post<QRScanResponse>(`${this.apiUrl}/scan`, { payload });
  }
}
