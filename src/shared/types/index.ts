export interface CloudflareImage {
  id: string;
  url?: string | null;
  filename?: string | null;
  uploaded?: string | null;
  tags?: string[] | null;
  metadata?: {
    [key: string]: any;
  } | null;
}

export interface Vehicle {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  price: number;
  mileage?: number;
  vin?: string;
  exterior_color?: string;
  interior_color?: string;
  fuel_type?: string;
  transmission?: string;
  engine?: string;
  drivetrain?: string;
  body_style?: string;
  condition?: string;
  seats?: number;
  dealer_id: number;
  description?: string;
  features?: string;
  status: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
  images?: VehicleImage[];
}

export interface VehicleImage {
  id: number;
  vehicle_id: number;
  image_url: string;
  cloudflare_id?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}
