import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

export interface RankingPosition {
  position: number;
  user: User;
}

interface RankingResponse {
  ranking: User[];
}

@Injectable({
  providedIn: 'root'
})
export class RankingService {
  private apiUrl = `${environment.apiUrl}/ranking`;

  constructor(private http: HttpClient) {}

  getTopRanking(limit: number = 10): Observable<User[]> {
    return this.http.get<RankingResponse>(this.apiUrl, { params: { limit } }).pipe(
      map(res => res.ranking)
    );
  }

  getMyPosition(): Observable<RankingPosition> {
    return this.http.get<RankingPosition>(`${this.apiUrl}/me`);
  }
}
