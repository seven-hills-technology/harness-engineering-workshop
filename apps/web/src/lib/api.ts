import type {
  CartView,
  LoginResponse,
  OrderView,
  ProductDetail,
  ProductListResponse,
  User,
} from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:7800';

const TOKEN_KEY = 'workshop.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// --- auth ---
export const login = (email: string, password: string) =>
  request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getMe = () => request<User>('/auth/me');

// --- products ---
export interface ProductQuery {
  search?: string;
  category?: string;
  skip?: number;
  limit?: number;
}

export const getProducts = (query: ProductQuery = {}) => {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.category) params.set('category', query.category);
  if (query.skip != null) params.set('skip', String(query.skip));
  if (query.limit != null) params.set('limit', String(query.limit));
  const qs = params.toString();
  return request<ProductListResponse>(`/products${qs ? `?${qs}` : ''}`);
};

export const getCategories = () => request<string[]>('/products/categories');

export const getProduct = (id: number) => request<ProductDetail>(`/products/${id}`);

export const createReview = (
  productId: number,
  input: { rating: number; comment: string },
) =>
  request<ProductDetail>(`/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

// --- cart ---
export const getCart = () => request<CartView>('/cart');

export const addCartItem = (productId: number, quantity: number) =>
  request<CartView>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });

export const updateCartItem = (productId: number, quantity: number) =>
  request<CartView>(`/cart/items/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });

export const removeCartItem = (productId: number) =>
  request<CartView>(`/cart/items/${productId}`, { method: 'DELETE' });

export const clearCart = () => request<CartView>('/cart', { method: 'DELETE' });

// --- orders ---
export const createOrder = () => request<OrderView>('/orders', { method: 'POST' });

export const getOrders = () => request<OrderView[]>('/orders');

export const getOrder = (id: number) => request<OrderView>(`/orders/${id}`);
