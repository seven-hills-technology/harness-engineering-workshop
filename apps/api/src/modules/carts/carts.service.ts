import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartItemView, CartView, ReservedMap } from './cart.types';
import { BUSY_RETRY_DELAYS, RESERVATION_TTL_MS } from './carts.constants';

type SqliteError = { driverError?: { code?: string }; code?: string };

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private readonly itemRepo: Repository<CartItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async getCart(userId: number): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId);
    const items = await this.itemRepo.find({
      where: { cartId: cart.id },
      relations: ['product'],
    });

    if (items.length === 0) {
      if (cart.reservedAt !== null) {
        await this.cartRepo.update({ id: cart.id }, { reservedAt: null });
      }
      return { items: [], expiresAt: null };
    }

    if (cart.reservedAt && this.isExpired(cart.reservedAt)) {
      await this.clearCartRows(cart.id);
      return { items: [], expiresAt: null, justExpired: true };
    }

    const productIds = items.map((i) => i.productId);
    const reserved = await this.getReservedQuantities(productIds);

    return {
      items: items.map((item) => this.toItemView(item, reserved)),
      expiresAt: cart.reservedAt ? this.expiryIso(cart.reservedAt) : null,
    };
  }

  async addItem(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<CartView> {
    this.validateQuantity(quantity, { allowZero: false });
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new BadRequestException('productId must be a positive integer');
    }

    const cart = await this.getOrCreateCart(userId);

    await this.withImmediateTx(async (m) => {
      const product = await m.findOne(Product, { where: { id: productId } });
      if (!product) {
        throw new NotFoundException(`Product #${productId} not found`);
      }

      const existing = await m.findOne(CartItem, {
        where: { cartId: cart.id, productId },
      });
      const currentLineQty = existing?.quantity ?? 0;
      const reserved = await this.sumReservedForProduct(m, productId);
      const available = product.stock - (reserved - currentLineQty);
      const newLineQty = currentLineQty + quantity;

      if (newLineQty > available) {
        throw new ConflictException(`Only ${Math.max(available, 0)} available`);
      }

      if (existing) {
        existing.quantity = newLineQty;
        await m.update(CartItem, { id: existing.id }, { quantity: newLineQty });
      } else {
        await m.insert(CartItem, {
          cartId: cart.id,
          productId,
          quantity,
        });
      }

      if (cart.reservedAt === null) {
        const now = new Date();
        cart.reservedAt = now;
        await m.update(Cart, { id: cart.id }, { reservedAt: now });
      }
    });

    return this.getCart(userId);
  }

  async updateItem(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<CartView> {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new BadRequestException('productId must be a positive integer');
    }
    this.validateQuantity(quantity, { allowZero: true });

    if (quantity === 0) {
      return this.removeItem(userId, productId);
    }

    const cart = await this.getOrCreateCart(userId);

    await this.withImmediateTx(async (m) => {
      const product = await m.findOne(Product, { where: { id: productId } });
      if (!product) {
        throw new NotFoundException(`Product #${productId} not found`);
      }

      const existing = await m.findOne(CartItem, {
        where: { cartId: cart.id, productId },
      });
      const currentLineQty = existing?.quantity ?? 0;
      const reserved = await this.sumReservedForProduct(m, productId);
      const available = product.stock - (reserved - currentLineQty);

      if (quantity > available) {
        throw new ConflictException(`Only ${Math.max(available, 0)} available`);
      }

      if (existing) {
        existing.quantity = quantity;
        await m.update(CartItem, { id: existing.id }, { quantity });
      } else {
        await m.insert(CartItem, {
          cartId: cart.id,
          productId,
          quantity,
        });
      }

      if (cart.reservedAt === null) {
        const now = new Date();
        cart.reservedAt = now;
        await m.update(Cart, { id: cart.id }, { reservedAt: now });
      }
    });

    return this.getCart(userId);
  }

  async removeItem(userId: number, productId: number): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId);
    await this.itemRepo.delete({ cartId: cart.id, productId });

    const remaining = await this.itemRepo.count({ where: { cartId: cart.id } });
    if (remaining === 0 && cart.reservedAt !== null) {
      await this.cartRepo.update({ id: cart.id }, { reservedAt: null });
    }

    return this.getCart(userId);
  }

  async clearCart(userId: number): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId);
    await this.clearCartRows(cart.id);
    return { items: [], expiresAt: null };
  }

  async getReservedQuantities(productIds: number[]): Promise<ReservedMap> {
    const map: ReservedMap = new Map();
    if (productIds.length === 0) {
      return map;
    }

    const cutoff = this.cutoffDate();
    const rows = await this.itemRepo
      .createQueryBuilder('ci')
      .innerJoin(Cart, 'c', 'c.id = ci.cartId')
      .select('ci.productId', 'productId')
      .addSelect('COALESCE(SUM(ci.quantity), 0)', 'reserved')
      .where('ci.productId IN (:...productIds)', { productIds })
      .andWhere('c.reservedAt IS NOT NULL')
      .andWhere('c.reservedAt > :cutoff', { cutoff })
      .groupBy('ci.productId')
      .getRawMany<{ productId: number; reserved: number | string }>();

    for (const row of rows) {
      map.set(Number(row.productId), Number(row.reserved));
    }
    return map;
  }

  private async getOrCreateCart(userId: number): Promise<Cart> {
    return this.withSqliteBusyRetry(async () => {
      const existing = await this.cartRepo.findOne({ where: { userId } });
      if (existing) {
        return existing;
      }
      await this.cartRepo
        .createQueryBuilder()
        .insert()
        .into(Cart)
        .values({ userId, reservedAt: null })
        .orIgnore()
        .execute();
      const created = await this.cartRepo.findOne({ where: { userId } });
      if (!created) {
        throw new Error(`Failed to create cart for user ${userId}`);
      }
      return created;
    });
  }

  private async clearCartRows(cartId: number): Promise<void> {
    await this.itemRepo.delete({ cartId });
    await this.cartRepo.update({ id: cartId }, { reservedAt: null });
  }

  private async sumReservedForProduct(
    m: EntityManager,
    productId: number,
  ): Promise<number> {
    const cutoff = this.cutoffDate();
    const row = await m
      .createQueryBuilder(CartItem, 'ci')
      .innerJoin(Cart, 'c', 'c.id = ci.cartId')
      .select('COALESCE(SUM(ci.quantity), 0)', 'reserved')
      .where('ci.productId = :productId', { productId })
      .andWhere('c.reservedAt IS NOT NULL')
      .andWhere('c.reservedAt > :cutoff', { cutoff })
      .getRawOne<{ reserved: number | string }>();
    return row ? Number(row.reserved) : 0;
  }

  private toItemView(item: CartItem, reserved: ReservedMap): CartItemView {
    const product = item.product;
    const totalReserved = reserved.get(item.productId) ?? 0;
    const availableStock = product
      ? product.stock - totalReserved + item.quantity
      : 0;
    return {
      productId: item.productId,
      title: product?.title ?? '',
      thumbnail: product?.thumbnail ?? '',
      price: product?.price ?? 0,
      quantity: item.quantity,
      availableStock: Math.max(availableStock, 0),
    };
  }

  private expiryIso(reservedAt: Date): string {
    return new Date(reservedAt.getTime() + RESERVATION_TTL_MS).toISOString();
  }

  private isExpired(reservedAt: Date): boolean {
    return reservedAt.getTime() + RESERVATION_TTL_MS <= Date.now();
  }

  private validateQuantity(
    quantity: number,
    opts: { allowZero: boolean },
  ): void {
    if (typeof quantity !== 'number' || !Number.isFinite(quantity)) {
      throw new BadRequestException('quantity must be a number');
    }
    if (!Number.isInteger(quantity)) {
      throw new BadRequestException('quantity must be an integer');
    }
    const min = opts.allowZero ? 0 : 1;
    if (quantity < min) {
      throw new BadRequestException(`quantity must be >= ${min}`);
    }
  }

  private async withImmediateTx<T>(
    fn: (m: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.withSqliteBusyRetry(async () => {
      const qr = this.dataSource.createQueryRunner();
      await qr.connect();
      await qr.query('BEGIN IMMEDIATE');
      try {
        const result = await fn(qr.manager);
        await qr.query('COMMIT');
        return result;
      } catch (err) {
        try {
          await qr.query('ROLLBACK');
        } catch {
          /* ignore rollback failure */
        }
        throw err;
      } finally {
        await qr.release();
      }
    });
  }

  private async withSqliteBusyRetry<T>(op: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt <= BUSY_RETRY_DELAYS.length; attempt++) {
      try {
        return await op();
      } catch (e) {
        if (!this.isRetryableSqliteError(e)) {
          throw e;
        }
        if (attempt === BUSY_RETRY_DELAYS.length) {
          break;
        }
        await this.delay(BUSY_RETRY_DELAYS[attempt]);
      }
    }
    throw new ServiceUnavailableException('Cart service is temporarily busy');
  }

  private isRetryableSqliteError(e: unknown): boolean {
    const err = e as SqliteError & { message?: string };
    const code = err?.driverError?.code ?? err?.code;
    if (code === 'SQLITE_BUSY' || code === 'SQLITE_LOCKED') {
      return true;
    }
    const msg = String(err?.message ?? '');
    // better-sqlite3 rejects overlapping transactions on its single connection
    // with a plain SqliteError; fold that into the retry path so parallel
    // reserve calls serialize instead of both failing.
    return msg.includes('cannot start a transaction within a transaction');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private cutoffDate(): Date {
    return new Date(Date.now() - RESERVATION_TTL_MS);
  }
}
