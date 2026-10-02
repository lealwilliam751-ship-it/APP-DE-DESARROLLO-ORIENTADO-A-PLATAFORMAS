import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

export interface RankingPosition {
  position: number;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class RankingService {
  private apiUrl = `${environment.apiUrl}/ranking`;

  constructor(private http: HttpClient) {}

  getTopRanking(limit: number = 10): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { params: { limit } });
  }

  getMyPosition(): Observable<RankingPosition> {
    return this.http.get<RankingPosition>(`${this.apiUrl}/me`);
  }
}
