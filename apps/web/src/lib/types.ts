// Mirrors the NestJS API response shapes (apps/api/src/modules/*/*.types.ts).

export interface User {
  id: number;
  email: string;
  isAdmin: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  category: string;
  brand: string;
  sku: string;
  thumbnail: string;
  rating: number;
  stock: number;
  lowStockThreshold: number;
  availabilityStatus: string;
  tags: string[];
  availableStock: number;
  reservedStock: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewerName: string;
  date: string;
}

export interface ProductImage {
  id: number;
  url: string;
}

export interface ProductDetail extends Product {
  reviews: Review[];
  images: ProductImage[];
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface CartItem {
  productId: number;
  title: string;
  thumbnail: string;
  price: number;
  quantity: number;
  availableStock: number;
}

export interface CartView {
  items: CartItem[];
  expiresAt: string | null;
  justExpired?: boolean;
}
