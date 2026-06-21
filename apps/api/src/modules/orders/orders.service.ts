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
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../carts/entities/cart-item.entity';
import { BUSY_RETRY_DELAYS } from '../carts/carts.constants';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderView } from './orders.types';

type SqliteError = { driverError?: { code?: string }; code?: string };

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async checkout(userId: number): Promise<OrderView> {
    const orderId = await this.withImmediateTx(async (m) => {
      const cart = await m.findOne(Cart, { where: { userId } });
      const items = cart
        ? await m.find(CartItem, {
            where: { cartId: cart.id },
            relations: ['product'],
          })
        : [];

      if (items.length === 0) {
        throw new BadRequestException('cart is empty');
      }

      let subtotal = 0;
      const lines: {
        productId: number;
        quantity: number;
        unitPrice: number;
        titleSnapshot: string;
      }[] = [];

      for (const item of items) {
        const product = item.product;
        if (!product) {
          throw new NotFoundException(`Product #${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Only ${product.stock} of "${product.title}" available`,
          );
        }

        subtotal += product.price * item.quantity;
        lines.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          titleSnapshot: product.title,
        });
      }

      // Use manager-level insert/update (not save) so we stay inside the
      // single BEGIN IMMEDIATE transaction; save() would open a nested
      // transaction, which better-sqlite3 rejects on its single connection.
      const orderInsert = await m.insert(Order, {
        userId,
        status: 'paid',
        subtotal,
        total: subtotal,
      });
      const orderId = Number(orderInsert.identifiers[0]?.id);
      if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new Error('Failed to create order');
      }

      for (const line of lines) {
        await m.insert(OrderItem, { orderId, ...line });
        await m.decrement(
          Product,
          { id: line.productId },
          'stock',
          line.quantity,
        );
      }

      // Clear the cart: drop its items and release the reservation.
      await m.delete(CartItem, { cartId: cart!.id });
      await m.update(Cart, { id: cart!.id }, { reservedAt: null });

      return orderId;
    });

    return this.getOrder(userId, orderId);
  }

  async listOrders(userId: number): Promise<OrderView[]> {
    const orders = await this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return orders.map((order) => this.toOrderView(order));
  }

  async getOrder(userId: number, id: number): Promise<OrderView> {
    const order = await this.orderRepo.findOne({
      where: { id, userId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return this.toOrderView(order);
  }

  private toOrderView(order: Order): OrderView {
    return {
      id: order.id,
      status: order.status,
      subtotal: order.subtotal,
      total: order.total,
      createdAt: order.createdAt,
      items: (order.items ?? []).map((item) => ({
        productId: item.productId,
        title: item.titleSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
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
    throw new ServiceUnavailableException('Order service is temporarily busy');
  }

  private isRetryableSqliteError(e: unknown): boolean {
    const err = e as SqliteError & { message?: string };
    const code = err?.driverError?.code ?? err?.code;
    if (code === 'SQLITE_BUSY' || code === 'SQLITE_LOCKED') {
      return true;
    }
    const msg = String(err?.message ?? '');
    // better-sqlite3 rejects overlapping transactions on its single connection
    // with a plain SqliteError; fold that into the retry path so concurrent
    // checkouts serialize instead of both failing.
    return msg.includes('cannot start a transaction within a transaction');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
