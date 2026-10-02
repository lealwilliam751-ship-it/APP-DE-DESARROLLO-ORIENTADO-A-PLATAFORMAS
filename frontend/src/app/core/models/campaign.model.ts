export type CampaignStatus = 'active' | 'completed' | 'cancelled';

export interface Campaign {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  goal_points: number;
  current_points: number;
  status: CampaignStatus;
  created_at?: string;
}
