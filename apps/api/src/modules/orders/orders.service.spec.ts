import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Review } from '../products/entities/review.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { User } from '../users/entities/user.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../carts/entities/cart-item.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';

type Ctx = {
  dataSource: DataSource;
  service: OrdersService;
  userId: number;
  productA: Product;
  productB: Product;
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

  const productRepo = dataSource.getRepository(Product);
  const productA = await productRepo.save(
    productRepo.create({
      title: 'Widget',
      description: 'a widget',
      price: 9.99,
      discountPercentage: 0,
      category: 'general',
      brand: 'ACME',
      sku: 'WID-1',
      thumbnail: '',
      rating: 0,
      stock: 5,
      lowStockThreshold: 10,
      availabilityStatus: 'In Stock',
      tags: [],
      warrantyInformation: '',
      shippingInformation: '',
      returnPolicy: '',
    }),
  );
  const productB = await productRepo.save(
    productRepo.create({
      title: 'Gadget',
      description: 'a gadget',
      price: 4.5,
      discountPercentage: 0,
      category: 'general',
      brand: 'ACME',
      sku: 'GAD-1',
      thumbnail: '',
      rating: 0,
      stock: 2,
      lowStockThreshold: 10,
      availabilityStatus: 'In Stock',
      tags: [],
      warrantyInformation: '',
      shippingInformation: '',
      returnPolicy: '',
    }),
  );

  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.save(
    userRepo.create({ email: 'buyer@test.com', passwordHash: 'x', isAdmin: false }),
  );

  const service = new OrdersService(dataSource.getRepository(Order), dataSource);

  return { dataSource, service, userId: user.id, productA, productB };
}

async function seedCart(
  dataSource: DataSource,
  userId: number,
  lines: { productId: number; quantity: number }[],
): Promise<Cart> {
  const cartRepo = dataSource.getRepository(Cart);
  const itemRepo = dataSource.getRepository(CartItem);
  const cart = await cartRepo.save(
    cartRepo.create({ userId, reservedAt: new Date() }),
  );
  for (const line of lines) {
    await itemRepo.save(
      itemRepo.create({
        cartId: cart.id,
        productId: line.productId,
        quantity: line.quantity,
      }),
    );
  }
  return cart;
}

describe('OrdersService.checkout', () => {
  it('creates an order, snapshots price/title, decrements stock, empties the cart', async () => {
    const { dataSource, service, userId, productA, productB } = await setup();
    try {
      const cart = await seedCart(dataSource, userId, [
        { productId: productA.id, quantity: 2 },
        { productId: productB.id, quantity: 1 },
      ]);

      const order = await service.checkout(userId);

      // Order totals.
      const expectedSubtotal = productA.price * 2 + productB.price * 1;
      expect(order.id).toBeGreaterThan(0);
      expect(order.status).toBe('paid');
      expect(order.subtotal).toBeCloseTo(expectedSubtotal, 5);
      expect(order.total).toBeCloseTo(expectedSubtotal, 5);

      // Snapshots.
      expect(order.items).toHaveLength(2);
      const a = order.items.find((i) => i.productId === productA.id)!;
      const b = order.items.find((i) => i.productId === productB.id)!;
      expect(a).toMatchObject({
        title: 'Widget',
        quantity: 2,
        unitPrice: productA.price,
      });
      expect(b).toMatchObject({
        title: 'Gadget',
        quantity: 1,
        unitPrice: productB.price,
      });

      // Stock decremented.
      const productRepo = dataSource.getRepository(Product);
      expect((await productRepo.findOneByOrFail({ id: productA.id })).stock).toBe(3);
      expect((await productRepo.findOneByOrFail({ id: productB.id })).stock).toBe(1);

      // Cart emptied + reservation released.
      const itemRepo = dataSource.getRepository(CartItem);
      expect(await itemRepo.count({ where: { cartId: cart.id } })).toBe(0);
      const refreshed = await dataSource
        .getRepository(Cart)
        .findOneByOrFail({ id: cart.id });
      expect(refreshed.reservedAt).toBeNull();

      // Persisted and retrievable.
      const fetched = await service.getOrder(userId, order.id);
      expect(fetched.items).toHaveLength(2);
    } finally {
      await dataSource.destroy();
    }
  });

  it('throws BadRequestException when the cart is empty', async () => {
    const { dataSource, service, userId } = await setup();
    try {
      await expect(service.checkout(userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      // No order created.
      expect(await dataSource.getRepository(Order).count()).toBe(0);
    } finally {
      await dataSource.destroy();
    }
  });

  it('throws ConflictException on insufficient stock and creates no order / leaves stock unchanged', async () => {
    const { dataSource, service, userId, productA, productB } = await setup();
    try {
      // productB only has stock 2, request 3.
      await seedCart(dataSource, userId, [
        { productId: productA.id, quantity: 1 },
        { productId: productB.id, quantity: 3 },
      ]);

      await expect(service.checkout(userId)).rejects.toBeInstanceOf(
        ConflictException,
      );

      // No order created.
      expect(await dataSource.getRepository(Order).count()).toBe(0);
      expect(await dataSource.getRepository(OrderItem).count()).toBe(0);

      // Stock unchanged (transaction rolled back).
      const productRepo = dataSource.getRepository(Product);
      expect((await productRepo.findOneByOrFail({ id: productA.id })).stock).toBe(5);
      expect((await productRepo.findOneByOrFail({ id: productB.id })).stock).toBe(2);
    } finally {
      await dataSource.destroy();
    }
  });
});
