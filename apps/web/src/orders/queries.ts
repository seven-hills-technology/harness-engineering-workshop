import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { CART_KEY } from '../cart/useCart';
import type { OrderView } from '../lib/types';

export const ORDERS_KEY = ['orders'];

export function useOrders() {
  const { user } = useAuth();
  return useQuery<OrderView[]>({
    queryKey: ORDERS_KEY,
    queryFn: api.getOrders,
    enabled: !!user,
  });
}

export function useOrder(id: number) {
  return useQuery<OrderView>({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id),
    enabled: Number.isFinite(id),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.createOrder(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_KEY });
      qc.invalidateQueries({ queryKey: ORDERS_KEY });
    },
  });
}
