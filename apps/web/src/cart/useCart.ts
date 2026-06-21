import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import type { CartView } from '../lib/types';

export const CART_KEY = ['cart'];

export function useCart() {
  const { user } = useAuth();
  return useQuery<CartView>({
    queryKey: CART_KEY,
    queryFn: api.getCart,
    enabled: !!user,
  });
}

export function useCartMutations() {
  const qc = useQueryClient();
  const onSuccess = (data: CartView) => qc.setQueryData(CART_KEY, data);

  const add = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.addCartItem(productId, quantity),
    onSuccess,
  });
  const update = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.updateCartItem(productId, quantity),
    onSuccess,
  });
  const remove = useMutation({
    mutationFn: (productId: number) => api.removeCartItem(productId),
    onSuccess,
  });

  return { add, update, remove };
}

export function cartCount(cart: CartView | undefined): number {
  return cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
}
