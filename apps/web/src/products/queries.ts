import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as api from '../lib/api';
import type { Product, ProductDetail, ProductListResponse } from '../lib/types';

export function useProducts(query: api.ProductQuery) {
  return useQuery<ProductListResponse>({
    queryKey: ['products', query],
    queryFn: () => api.getProducts(query),
    // Keep the current page's rows (and the pager) on screen while the next
    // page loads, instead of unmounting the grid to a loading state on every
    // page change.
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery<string[]>({ queryKey: ['categories'], queryFn: api.getCategories });
}

export function useBrands() {
  return useQuery<string[]>({ queryKey: ['brands'], queryFn: api.getBrands });
}

export function useRelated(productId: number) {
  return useQuery<Product[]>({
    queryKey: ['related', productId],
    queryFn: () => api.getRelated(productId),
    enabled: Number.isFinite(productId),
  });
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
