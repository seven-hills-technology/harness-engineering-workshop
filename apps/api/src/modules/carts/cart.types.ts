export type CartItemView = {
  productId: number;
  title: string;
  thumbnail: string;
  price: number;
  quantity: number;
  availableStock: number;
};

export type CartView = {
  items: CartItemView[];
  expiresAt: string | null;
  justExpired?: boolean;
};

export type AddItemInput = {
  productId: number;
  quantity: number;
};

export type UpdateItemInput = {
  quantity: number;
};

export type ReservedMap = Map<number, number>;
