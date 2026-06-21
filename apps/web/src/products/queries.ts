import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';
import type { ProductDetail, ProductListResponse } from '../lib/types';

export function useProducts(query: api.ProductQuery) {
  return useQuery<ProductListResponse>({
    queryKey: ['products', query],
    queryFn: () => api.getProducts(query),
  });
}

export function useCategories() {
  return useQuery<string[]>({ queryKey: ['categories'], queryFn: api.getCategories });
}

export function useProduct(id: number) {
  return useQuery<ProductDetail>({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateReview(productId: number) {
  const qc = useQueryClient();
  return useMutation<ProductDetail, Error, { rating: number; comment: string }>({
    mutationFn: (input) => api.createReview(productId, input),
    onSuccess: (updated) => {
      qc.setQueryData(['product', productId], updated);
    },
  });
}
