export type Category = 'course' | 'file' | 'hardware';
export type OrderStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  role: 'user' | 'admin' | 'developer' | 'owner';
  points: number;
  is_banned?: boolean;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    full_name: string;
    role: 'user' | 'admin' | 'developer' | 'owner';
  };
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  category: Category;
  content_url?: string;
  tutorial_url?: string;
  image_url: string;
  is_featured?: boolean;
  stock_status?: string;
  requirements?: string;
  features?: string[];
  demo_url?: string;
  publisher_id?: string;
  publisher_name?: string;
  profiles?: {
    full_name: string;
    role: 'user' | 'admin' | 'developer' | 'owner';
  };
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  trx_id: string;
  status: OrderStatus;
  created_at: string;
  profiles?: Profile;
  products?: Product;
}

export interface Settings {
  key: string;
  value: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface ProductView {
  id: string;
  user_id?: string;
  product_id: string;
  created_at: string;
}
