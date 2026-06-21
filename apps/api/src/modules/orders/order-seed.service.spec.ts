import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Review } from '../products/entities/review.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { User } from '../users/entities/user.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../carts/entities/cart-item.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderSeedService } from './order-seed.service';

const DAY_MS = 24 * 60 * 60 * 1000;

type Ctx = {
  dataSource: DataSource;
  service: OrderSeedService;
};

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

  const userRepo = dataSource.getRepository(User);
  await userRepo.save([
    userRepo.create({
      email: 'admin@test.com',
      passwordHash: 'x',
      isAdmin: true,
    }),
    userRepo.create({
      email: 'user@test.com',
      passwordHash: 'x',
      isAdmin: false,
    }),
  ]);

  const productRepo = dataSource.getRepository(Product);
  const products = Array.from({ length: 20 }, (_, i) =>
    productRepo.create({
      title: `Product ${i}`,
      description: 'desc',
      price: 5 + i,
      discountPercentage: 0,
      category: 'general',
      brand: 'ACME',
      sku: `SKU-${i}`,
      thumbnail: '',
      rating: 0,
      stock: 100,
      lowStockThreshold: 10,
      availabilityStatus: 'In Stock',
      tags: [],
      warrantyInformation: '',
      shippingInformation: '',
      returnPolicy: '',
    }),
  );
  await productRepo.save(products);

  const service = new OrderSeedService(
    dataSource.getRepository(Order),
    dataSource.getRepository(User),
    dataSource.getRepository(Product),
    dataSource,
  );

  return { dataSource, service };
}

describe('OrderSeedService', () => {
  it('seeds synthetic orders with items, varied statuses, and a backdated date range', async () => {
    const { dataSource, service } = await setup();
    try {
      await service.seed();

      const orderRepo = dataSource.getRepository(Order);
      const itemRepo = dataSource.getRepository(OrderItem);

      const orderCount = await orderRepo.count();
      expect(orderCount).toBeGreaterThan(0);

      // OrderItems exist.
      expect(await itemRepo.count()).toBeGreaterThan(0);

      // Stock is preserved (historical records do not decrement the catalog).
      const productRepo = dataSource.getRepository(Product);
      const products = await productRepo.find();
      for (const product of products) {
        expect(product.stock).toBe(100);
      }

      const orders = await orderRepo.find();

      // More than one distinct status.
      const statuses = new Set(orders.map((o) => o.status));
      expect(statuses.size).toBeGreaterThan(1);

      // Subtotals/totals computed and consistent.
      for (const order of orders) {
        expect(order.subtotal).toBeGreaterThan(0);
        expect(order.total).toBeCloseTo(order.subtotal, 5);
      }

      // createdAt values span a range and at least one is backdated > 1 day ago.
      const times = orders.map((o) => o.createdAt.getTime());
      const min = Math.min(...times);
      const max = Math.max(...times);
      expect(max - min).toBeGreaterThan(DAY_MS);

      const now = Date.now();
      expect(min).toBeLessThan(now - DAY_MS);
    } finally {
      await dataSource.destroy();
    }
  });

  it('produces 1-4 distinct products per order with quantities 1-3', async () => {
    const { dataSource, service } = await setup();
    try {
      await service.seed();

      const orders = await dataSource.getRepository(Order).find({
        relations: ['items'],
      });
      for (const order of orders) {
        expect(order.items.length).toBeGreaterThanOrEqual(1);
        expect(order.items.length).toBeLessThanOrEqual(4);

        const productIds = order.items.map((i) => i.productId);
        expect(new Set(productIds).size).toBe(productIds.length); // distinct

        for (const item of order.items) {
          expect(item.quantity).toBeGreaterThanOrEqual(1);
          expect(item.quantity).toBeLessThanOrEqual(3);
        }
      }
    } finally {
      await dataSource.destroy();
    }
  });

  it('skips seeding when there are no products', async () => {
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
    try {
      const userRepo = dataSource.getRepository(User);
      await userRepo.save(
        userRepo.create({
          email: 'admin@test.com',
          passwordHash: 'x',
          isAdmin: true,
        }),
      );

      const service = new OrderSeedService(
        dataSource.getRepository(Order),
        dataSource.getRepository(User),
        dataSource.getRepository(Product),
        dataSource,
      );

      await service.seed();
      expect(await dataSource.getRepository(Order).count()).toBe(0);
    } finally {
      await dataSource.destroy();
    }
  });

  it('is idempotent — a second run adds no orders', async () => {
    const { dataSource, service } = await setup();
    try {
      await service.seed();
      const after = await dataSource.getRepository(Order).count();
      expect(after).toBeGreaterThan(0);

      await service.seed();
      const afterSecond = await dataSource.getRepository(Order).count();
      expect(afterSecond).toBe(after);
    } finally {
      await dataSource.destroy();
    }
  });
});
