export interface DashboardTotals {
  revenue: number;
  orderCount: number;
  paidOrFulfilledCount: number;
}

export interface RevenueByWeek {
  /** ISO week Monday, formatted as YYYY-MM-DD. */
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

export interface OrdersByStatus {
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
  totals: DashboardTotals;
  revenueByWeek: RevenueByWeek[];
  topProducts: TopProduct[];
  ordersByStatus: OrdersByStatus[];
  lowStock: LowStockItem[];
}
