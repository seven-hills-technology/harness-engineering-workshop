import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

const SEED_USER_EMAILS = ['admin@test.com', 'user@test.com'];
const TARGET_ORDER_COUNT = 120;
const SPAN_DAYS = 84; // past 12 weeks
const MAX_PRODUCTS = 150;
const DAY_MS = 24 * 60 * 60 * 1000;

// Weighted status distribution: paid ~45%, fulfilled ~35%, pending ~12%, cancelled ~8%.
const STATUS_WEIGHTS: { status: OrderStatus; weight: number }[] = [
  { status: 'paid', weight: 45 },
  { status: 'fulfilled', weight: 35 },
  { status: 'pending', weight: 12 },
  { status: 'cancelled', weight: 8 },
];

@Injectable()
export class OrderSeedService implements OnModuleInit {
  private readonly logger = new Logger(OrderSeedService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seed();
    } catch (error) {
      this.logger.warn(
        `Failed to seed orders: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async seed(): Promise<void> {
    const count = await this.orderRepo.count();
    if (count > 0) {
      this.logger.log(`Orders already seeded (${count} orders)`);
      return;
    }

    const users = await this.userRepo.find({
      where: SEED_USER_EMAILS.map((email) => ({ email })),
    });
    if (users.length === 0) {
      this.logger.warn('No seed users found; skipping order seeding');
      return;
    }

    const products = await this.productRepo.find({ take: MAX_PRODUCTS });
    if (products.length === 0) {
      this.logger.warn('No products found; skipping order seeding');
      return;
    }

    const now = Date.now();
    const earliest = now - SPAN_DAYS * DAY_MS;

    // Insert + backdate run inside one transaction so the operation is
    // all-or-nothing. Otherwise a crash mid-seed could leave half-backdated
    // rows that the count()>0 idempotency gate would then permanently skip.
    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);

      // Track the createdAt we want for each saved order so we can backdate it
      // after insert (see note below).
      const backdates: { id: number; iso: string }[] = [];

      for (let i = 0; i < TARGET_ORDER_COUNT; i++) {
        const user = pickRandom(users);
        const createdAtMs = randomInt(earliest, now);
        const status = pickWeightedStatus();

        const lineProducts = pickDistinct(products, randomInt(1, 4));
        const items = lineProducts.map((product) => {
          const quantity = randomInt(1, 3);
          const item = new OrderItem();
          item.productId = product.id;
          item.quantity = quantity;
          item.unitPrice = product.price; // snapshot price
          item.titleSnapshot = product.title; // snapshot title
          return item;
        });

        const subtotal = items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0,
        );

        const order = new Order();
        order.userId = user.id;
        order.status = status;
        order.subtotal = subtotal;
        order.total = subtotal;
        order.items = items;

        // NOTE: We intentionally do NOT decrement Product.stock here — these
        // are historical records and the catalog must stay in stock for live
        // demos.
        const saved = await orderRepo.save(order);
        backdates.push({
          id: saved.id,
          iso: new Date(createdAtMs).toISOString(),
        });
      }

      // Order.createdAt is a @CreateDateColumn, so TypeORM stamps "now" on
      // insert and ignores any value we set on the entity. Backdate it with a
      // raw UPDATE against the actual table/column ("orders"."createdAt").
      for (const { id, iso } of backdates) {
        await manager.query(
          'UPDATE "orders" SET "createdAt" = ? WHERE "id" = ?',
          [iso, id],
        );
      }

      // Confirm the backdating actually persisted; throw to roll back the whole
      // transaction if it did not, so we never commit a non-backdated table.
      const sample = backdates[0];
      if (sample) {
        const reread = await orderRepo.findOne({ where: { id: sample.id } });
        if (!reread || reread.createdAt.getTime() >= now) {
          throw new Error(
            'Order backdating did not persist — createdAt is not in the past',
          );
        }
      }
    });

    const rangeStart = new Date(earliest).toISOString().slice(0, 10);
    const rangeEnd = new Date(now).toISOString().slice(0, 10);
    this.logger.log(
      `Seeded ${TARGET_ORDER_COUNT} synthetic orders across ${rangeStart} to ${rangeEnd}`,
    );
  }
}

function randomInt(min: number, max: number): number {
  // Inclusive of both bounds. Math.random is fine for synthetic seed data.
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickDistinct<T>(items: T[], n: number): T[] {
  const count = Math.min(n, items.length);
  const pool = [...items];
  const picked: T[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

function pickWeightedStatus(): OrderStatus {
  const total = STATUS_WEIGHTS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const { status, weight } of STATUS_WEIGHTS) {
    roll -= weight;
    if (roll < 0) {
      return status;
    }
  }
  return STATUS_WEIGHTS[0].status;
}
