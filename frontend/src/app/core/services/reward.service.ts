import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reward, RedeemedReward } from '../models/reward.model';

@Injectable({
  providedIn: 'root'
})
export class RewardService {
  private apiUrl = `${environment.apiUrl}/rewards`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Reward[]> {
    return this.http.get<Reward[]>(this.apiUrl);
  }

  redeem(rewardId: number): Observable<RedeemedReward> {
    return this.http.post<RedeemedReward>(`${this.apiUrl}/${rewardId}/redeem`, {});
  }

  getMyRedeemedHistory(): Observable<RedeemedReward[]> {
    return this.http.get<RedeemedReward[]>(`${this.apiUrl}/history`);
  }

  create(data: Omit<Reward, 'id'>): Observable<Reward> {
    return this.http.post<Reward>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Reward>): Observable<Reward> {
    return this.http.put<Reward>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
