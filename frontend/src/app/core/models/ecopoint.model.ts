export interface EcoPoint {
  id: number;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  created_at?: string;
}

export interface EcoPointCreateDTO {
  name: string;
  address: string;
  city?: string;
  lat: number;
  lng: number;
}
