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

export interface OrderItemView {
  productId: number;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderView {
  id: number;
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled';
  subtotal: number;
  total: number;
  createdAt: string;
  items: OrderItemView[];
}

export interface AdminDashboardTotals {
  revenue: number;
  orderCount: number;
  paidOrFulfilledCount: number;
}

export interface RevenueByWeekPoint {
  weekStart: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: number;
  title: string;
  units: number;
  revenue: number;
}

export interface OrdersByStatusPoint {
  status: string;
  count: number;
}

export interface LowStockItem {
  id: number;
  title: string;
  stock: number;
  lowStockThreshold: number;
}

export interface AdminDashboard {
  totals: AdminDashboardTotals;
  revenueByWeek: RevenueByWeekPoint[];
  topProducts: TopProduct[];
  ordersByStatus: OrdersByStatusPoint[];
  lowStock: LowStockItem[];
}
