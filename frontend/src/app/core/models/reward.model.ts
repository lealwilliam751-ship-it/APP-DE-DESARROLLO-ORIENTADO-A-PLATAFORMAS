export interface Reward {
  id: number;
  name: string;
  description: string;
  category: string;
  point_cost: number;
  stock: number;
  created_at?: string;
}

export interface RedeemedReward {
  id: number;
  user_id: number;
  reward_id: number;
  reward_name?: string;
  points_spent: number;
  redemption_code: string;
  redeemed_at: string;
}
