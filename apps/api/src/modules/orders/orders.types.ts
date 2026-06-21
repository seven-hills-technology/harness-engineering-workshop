import { OrderStatus } from './entities/order.entity';

export type OrderItemView = {
  productId: number;
  title: string;
  quantity: number;
  unitPrice: number;
};

export type OrderView = {
  id: number;
  status: OrderStatus;
  subtotal: number;
  total: number;
  createdAt: Date;
  items: OrderItemView[];
};
