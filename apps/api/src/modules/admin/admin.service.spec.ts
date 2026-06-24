import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Review } from '../products/entities/review.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { User } from '../users/entities/user.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../carts/entities/cart-item.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { AdminService } from './admin.service';

interface Ctx {
  dataSource: DataSource;
  service: AdminService;
  wellStocked: Product;
  lowStocked: Product;
}

function makeProduct(overrides: Partial<Product>): Partial<Product> {
  return {
    title: 'Product',
    description: 'desc',
    price: 10,
    discountPercentage: 0,
    category: 'general',
    brand: 'ACME',
    sku: 'SKU',
    thumbnail: '',
    rating: 0,
    stock: 100,
    lowStockThreshold: 10,
    availabilityStatus: 'In Stock',
    tags: [],
    warrantyInformation: '',
    shippingInformation: '',
    returnPolicy: '',
    ...overrides,
  };
}

async function setup(): Promise<Ctx> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [
      Product,
      Review,
      ProductImage,
      User,
      Cart,
      CartItem,
      Order,
      OrderItem,
    ],
    synchronize: true,
    enableWAL: true,
  });
  await dataSource.initialize();

  const productRepo = dataSource.getRepository(Product);
  const wellStocked = await productRepo.save(
    productRepo.create(
      makeProduct({ title: 'Widget', sku: 'WID-1', stock: 50, lowStockThreshold: 10 }),
    ),
  );
  const lowStocked = await productRepo.save(
    productRepo.create(
      makeProduct({ title: 'Gadget', sku: 'GAD-1', stock: 2, lowStockThreshold: 10 }),
    ),
  );

  const service = new AdminService(
    dataSource.getRepository(Order),
    dataSource.getRepository(OrderItem),
    dataSource.getRepository(Product),
  );

  return { dataSource, service, wellStocked, lowStocked };
}

async function seedOrder(
  dataSource: DataSource,
  opts: {
    status: OrderStatus;
    total: number;
    createdAt?: Date;
    items?: { product: Product; quantity: number; unitPrice: number }[];
  },
): Promise<Order> {
  const orderRepo = dataSource.getRepository(Order);
  const itemRepo = dataSource.getRepository(OrderItem);
  const order = await orderRepo.save(
    orderRepo.create({
      userId: 1,
      status: opts.status,
      subtotal: opts.total,
      total: opts.total,
    }),
  );

  if (opts.createdAt) {
    // CreateDateColumn auto-fills; overwrite to control week bucketing.
    await orderRepo.update(order.id, { createdAt: opts.createdAt });
  }

  for (const item of opts.items ?? []) {
    await itemRepo.save(
      itemRepo.create({
        orderId: order.id,
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        titleSnapshot: item.product.title,
      }),
    );
  }

  return order;
}

// Fixed reference "now" so week bucketing is fully deterministic and never
// depends on the wall clock or the machine's timezone. Mid-week (a Wednesday,
// noon UTC) keeps every seeded order clear of week boundaries.
const NOW = new Date('2026-03-18T12:00:00.000Z');

function daysBefore(base: Date, n: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

describe('AdminService.getDashboard', () => {
  it('aggregates totals, status counts, top products, low stock, and weekly revenue', async () => {
    const { dataSource, service, wellStocked, lowStocked } = await setup();
    try {
      // paid order this week: total 100, items: 3x Widget@20 = 60 revenue
      await seedOrder(dataSource, {
        status: 'paid',
        total: 100,
        createdAt: NOW,
        items: [{ product: wellStocked, quantity: 3, unitPrice: 20 }],
      });
      // fulfilled order this week: total 50, items: 5x Gadget@5 = 25 revenue
      await seedOrder(dataSource, {
        status: 'fulfilled',
        total: 50,
        createdAt: NOW,
        items: [{ product: lowStocked, quantity: 5, unitPrice: 5 }],
      });
      // pending order: excluded from revenue/topProducts, counted in status
      await seedOrder(dataSource, {
        status: 'pending',
        total: 999,
        items: [{ product: wellStocked, quantity: 100, unitPrice: 999 }],
      });
      // cancelled order: excluded from revenue/topProducts, counted in status
      await seedOrder(dataSource, {
        status: 'cancelled',
        total: 777,
        items: [{ product: lowStocked, quantity: 50, unitPrice: 777 }],
      });
      // backdated paid orders into prior weeks (still within last 84 days)
      await seedOrder(dataSource, {
        status: 'paid',
        total: 30,
        createdAt: daysBefore(NOW, 10),
        items: [{ product: wellStocked, quantity: 1, unitPrice: 30 }],
      });
      await seedOrder(dataSource, {
        status: 'paid',
        total: 40,
        createdAt: daysBefore(NOW, 20),
        items: [{ product: wellStocked, quantity: 1, unitPrice: 40 }],
      });

      const dash = await service.getDashboard(NOW);

      // totals.revenue excludes pending/cancelled (100 + 50 + 30 + 40 = 220)
      expect(dash.totals.revenue).toBeCloseTo(220, 5);
      expect(dash.totals.orderCount).toBe(6);
      expect(dash.totals.paidOrFulfilledCount).toBe(4);

      // ordersByStatus: all four keys, correct counts
      const statusMap = new Map(
        dash.ordersByStatus.map((s) => [s.status, s.count]),
      );
      expect(dash.ordersByStatus).toHaveLength(4);
      expect(statusMap.get('pending')).toBe(1);
      expect(statusMap.get('paid')).toBe(3);
      expect(statusMap.get('fulfilled')).toBe(1);
      expect(statusMap.get('cancelled')).toBe(1);

      // topProducts ordered by revenue desc, correct units (paid/fulfilled only)
      // Widget revenue: 60 + 30 + 40 = 130, units 3+1+1 = 5
      // Gadget revenue: 25, units 5
      expect(dash.topProducts).toHaveLength(2);
      expect(dash.topProducts[0].productId).toBe(wellStocked.id);
      expect(dash.topProducts[0].revenue).toBeCloseTo(130, 5);
      expect(dash.topProducts[0].units).toBe(5);
      expect(dash.topProducts[0].title).toBe('Widget');
      expect(dash.topProducts[1].productId).toBe(lowStocked.id);
      expect(dash.topProducts[1].revenue).toBeCloseTo(25, 5);
      expect(dash.topProducts[1].units).toBe(5);

      // lowStock includes the low-stock product, excludes well-stocked
      const lowStockIds = dash.lowStock.map((p) => p.id);
      expect(lowStockIds).toContain(lowStocked.id);
      expect(lowStockIds).not.toContain(wellStocked.id);
      const low = dash.lowStock.find((p) => p.id === lowStocked.id)!;
      expect(low.stock).toBe(2);
      expect(low.lowStockThreshold).toBe(10);

      // revenueByWeek: 12 chronological buckets, zero-filled, ascending
      expect(dash.revenueByWeek).toHaveLength(12);
      const weekStarts = dash.revenueByWeek.map((w) => w.weekStart);
      const sorted = [...weekStarts].sort();
      expect(weekStarts).toEqual(sorted);
      // last bucket (current week) holds the two non-backdated paid/fulfilled orders
      const lastWeek = dash.revenueByWeek[dash.revenueByWeek.length - 1];
      expect(lastWeek.revenue).toBeCloseTo(150, 5);
      expect(lastWeek.orders).toBe(2);
      // backdated orders land in earlier buckets: total weekly revenue = 220
      const weeklyTotal = dash.revenueByWeek.reduce(
        (sum, w) => sum + w.revenue,
        0,
      );
      expect(weeklyTotal).toBeCloseTo(220, 5);
    } finally {
      await dataSource.destroy();
    }
  });

  it('zero-fills statuses and weeks when there are no orders', async () => {
    const { dataSource, service } = await setup();
    try {
      const dash = await service.getDashboard(NOW);
      expect(dash.totals.revenue).toBe(0);
      expect(dash.totals.orderCount).toBe(0);
      expect(dash.totals.paidOrFulfilledCount).toBe(0);
      expect(dash.ordersByStatus).toHaveLength(4);
      expect(dash.ordersByStatus.every((s) => s.count === 0)).toBe(true);
      expect(dash.revenueByWeek).toHaveLength(12);
      expect(dash.revenueByWeek.every((w) => w.revenue === 0 && w.orders === 0)).toBe(
        true,
      );
      expect(dash.topProducts).toHaveLength(0);
    } finally {
      await dataSource.destroy();
    }
  });
});
