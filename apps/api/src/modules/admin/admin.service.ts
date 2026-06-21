import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import {
  AdminDashboard,
  DashboardTotals,
  LowStockItem,
  OrdersByStatus,
  RevenueByWeek,
  TopProduct,
} from './admin.types';

const REVENUE_STATUSES: OrderStatus[] = ['paid', 'fulfilled'];
const ALL_STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'fulfilled',
  'cancelled',
];
const WEEKS = 12;
const DAYS_PER_WEEK = 7;
const TOP_PRODUCTS_LIMIT = 10;
const LOW_STOCK_LIMIT = 20;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getDashboard(): Promise<AdminDashboard> {
    const [totals, revenueByWeek, topProducts, ordersByStatus, lowStock] =
      await Promise.all([
        this.getTotals(),
        this.getRevenueByWeek(),
        this.getTopProducts(),
        this.getOrdersByStatus(),
        this.getLowStock(),
      ]);

    return { totals, revenueByWeek, topProducts, ordersByStatus, lowStock };
  }

  private async getTotals(): Promise<DashboardTotals> {
    const row = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total), 0)', 'revenue')
      .addSelect('COUNT(*)', 'paidOrFulfilledCount')
      .where('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .getRawOne<{ revenue: number | string; paidOrFulfilledCount: number | string }>();

    const orderCount = await this.orderRepo.count();

    return {
      revenue: round2(Number(row?.revenue ?? 0)),
      orderCount,
      paidOrFulfilledCount: Number(row?.paidOrFulfilledCount ?? 0),
    };
  }

  private async getRevenueByWeek(): Promise<RevenueByWeek[]> {
    // Build the 12 chronological week buckets ending with the current week.
    const buckets = buildWeekBuckets(new Date(), WEEKS);
    const earliest = buckets[0].start;

    const orders = await this.orderRepo
      .createQueryBuilder('o')
      .select(['o.createdAt AS createdAt', 'o.total AS total'])
      .where('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .andWhere('o.createdAt >= :earliest', { earliest })
      .getRawMany<{ createdAt: string | Date; total: number | string }>();

    const byKey = new Map<string, { revenue: number; orders: number }>();
    for (const bucket of buckets) {
      byKey.set(bucket.key, { revenue: 0, orders: 0 });
    }

    for (const order of orders) {
      const created = new Date(order.createdAt);
      const monday = isoWeekMonday(created);
      const key = formatDate(monday);
      const bucket = byKey.get(key);
      if (bucket) {
        bucket.revenue += Number(order.total);
        bucket.orders += 1;
      }
    }

    return buckets.map((bucket) => {
      const data = byKey.get(bucket.key)!;
      return {
        weekStart: bucket.key,
        revenue: round2(data.revenue),
        orders: data.orders,
      };
    });
  }

  private async getTopProducts(): Promise<TopProduct[]> {
    const rows = await this.orderItemRepo
      .createQueryBuilder('item')
      .innerJoin(Order, 'o', 'o.id = item.orderId')
      .select('item.productId', 'productId')
      .addSelect('MAX(item.titleSnapshot)', 'title')
      .addSelect('SUM(item.quantity)', 'units')
      .addSelect('SUM(item.unitPrice * item.quantity)', 'revenue')
      .where('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .groupBy('item.productId')
      .orderBy('revenue', 'DESC')
      // Stable tiebreakers so ordering and the limit boundary are deterministic.
      .addOrderBy('units', 'DESC')
      .addOrderBy('item.productId', 'ASC')
      .limit(TOP_PRODUCTS_LIMIT)
      .getRawMany<{
        productId: number | string;
        title: string;
        units: number | string;
        revenue: number | string;
      }>();

    return rows.map((row) => ({
      productId: Number(row.productId),
      title: row.title,
      units: Number(row.units),
      revenue: round2(Number(row.revenue)),
    }));
  }

  private async getOrdersByStatus(): Promise<OrdersByStatus[]> {
    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status')
      .getRawMany<{ status: string; count: number | string }>();

    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.status, Number(row.count));
    }

    return ALL_STATUSES.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
  }

  private async getLowStock(): Promise<LowStockItem[]> {
    const products = await this.productRepo
      .createQueryBuilder('product')
      .select([
        'product.id AS id',
        'product.title AS title',
        'product.stock AS stock',
        'product.lowStockThreshold AS lowStockThreshold',
      ])
      .where('product.stock <= product.lowStockThreshold')
      .orderBy('product.stock', 'ASC')
      .addOrderBy('product.id', 'ASC')
      .limit(LOW_STOCK_LIMIT)
      .getRawMany<{
        id: number | string;
        title: string;
        stock: number | string;
        lowStockThreshold: number | string;
      }>();

    return products.map((product) => ({
      id: Number(product.id),
      title: product.title,
      stock: Number(product.stock),
      lowStockThreshold: Number(product.lowStockThreshold),
    }));
  }
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Monday 00:00:00 (local) of the ISO week containing `date`. */
function isoWeekMonday(date: Date): Date {
  const monday = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  // getDay(): 0 (Sun) .. 6 (Sat). Map to offset back to Monday.
  const day = monday.getDay();
  const diff = (day + 6) % 7; // Mon=0, Sun=6
  monday.setDate(monday.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface WeekBucket {
  key: string;
  start: Date;
}

/** `count` chronological ISO-week buckets ending with the week containing `now`. */
function buildWeekBuckets(now: Date, count: number): WeekBucket[] {
  const currentMonday = isoWeekMonday(now);
  const buckets: WeekBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    // Step by calendar days (not fixed milliseconds) so DST transitions don't
    // shift the bucket onto an adjacent day. This keeps the bucket keys aligned
    // with isoWeekMonday(), which is reused to place each order.
    const start = new Date(currentMonday);
    start.setDate(start.getDate() - i * DAYS_PER_WEEK);
    start.setHours(0, 0, 0, 0);
    buckets.push({ key: formatDate(start), start });
  }
  return buckets;
}
