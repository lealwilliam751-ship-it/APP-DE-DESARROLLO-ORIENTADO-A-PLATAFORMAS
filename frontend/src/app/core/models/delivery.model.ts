export type DeliveryStatus = 'pending' | 'approved' | 'rejected';

export interface DeliveryItem {
  id?: number;
  delivery_id?: number;
  material_id: number;
  material_name?: string;
  weight_kg: number;
  points?: number;
  co2_saved?: number;
}

export interface Delivery {
  id: number;
  user_id: number;
  user_name?: string;
  citizen_name?: string;
  ecopoint_id: number;
  ecopoint_name?: string;
  status: DeliveryStatus;
  total_points: number;
  total_co2: number;
  created_at: string;
  updated_at?: string;
  items?: DeliveryItem[];
}

export interface CreateDeliveryDTO {
  ecopoint_id: number;
  citizen_id?: number;
  auto_approve?: boolean;
  items: {
    material_id: number;
    weight_kg: number;
  }[];
}
