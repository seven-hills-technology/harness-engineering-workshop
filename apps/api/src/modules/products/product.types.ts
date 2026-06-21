import { Product } from './entities/product.entity';

export type ProductListItem = Product & {
  availableStock: number;
  reservedStock: number;
};

export type ProductDetail = Product & {
  availableStock: number;
  reservedStock: number;
};

export type ProductListResponse = {
  products: ProductListItem[];
  total: number;
  skip: number;
  limit: number;
};

export type ProductListQuery = {
  category?: string;
  search?: string;
  skip?: number;
  limit?: number;
  lowStock?: boolean | string;
};

export type InventoryUpdateInput = {
  stock?: number;
  lowStockThreshold?: number;
};

export type CreateReviewInput = {
  rating: number;
  comment: string;
};

export type BulkAdjustOperation = 'set' | 'add' | 'subtract';

export type BulkAdjustInput = {
  productIds: number[];
  operation: BulkAdjustOperation;
  value: number;
};

export type BulkAdjustSuccess = { id: number; stock: number };
export type BulkAdjustFailure = { id: number; reason: string };
export type BulkAdjustResult = {
  succeeded: BulkAdjustSuccess[];
  failed: BulkAdjustFailure[];
};
