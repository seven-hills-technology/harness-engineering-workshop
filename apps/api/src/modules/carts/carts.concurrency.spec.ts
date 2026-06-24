import {
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Review } from '../products/entities/review.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { User } from '../users/entities/user.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartsService } from './carts.service';

async function setup(): Promise<{
  dataSource: DataSource;
  service: CartsService;
  productId: number;
  user1: number;
  user2: number;
}> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [Product, Review, ProductImage, User, Cart, CartItem],
    synchronize: true,
    enableWAL: true,
  });
  await dataSource.initialize();

  const productRepo = dataSource.getRepository(Product);
  const product = productRepo.create({
    title: 'Last Unit',
    description: 'one left',
    price: 1,
    discountPercentage: 0,
    category: 'general',
    brand: 'ACME',
    sku: 'LAST-1',
    thumbnail: '',
    rating: 0,
    stock: 1,
    lowStockThreshold: 10,
    availabilityStatus: 'In Stock',
    tags: [],
    warrantyInformation: '',
    shippingInformation: '',
    returnPolicy: '',
  });
  const savedProduct = await productRepo.save(product);

  const userRepo = dataSource.getRepository(User);
  const [u1, u2] = await userRepo.save([
    userRepo.create({
      email: 'u1@test.com',
      passwordHash: 'x',
      isAdmin: false,
    }),
    userRepo.create({
      email: 'u2@test.com',
      passwordHash: 'x',
      isAdmin: false,
    }),
  ]);

  const service = new CartsService(
    dataSource.getRepository(Cart),
    dataSource.getRepository(CartItem),
    dataSource.getRepository(Product),
    dataSource,
  );

  return {
    dataSource,
    service,
    productId: savedProduct.id,
    user1: u1.id,
    user2: u2.id,
  };
}

describe('CartsService concurrency', () => {
  it('never double-reserves the last unit when two users add simultaneously', async () => {
    const { dataSource, service, productId, user1, user2 } = await setup();

    try {
      const results = await Promise.allSettled([
        service.addItem(user1, productId, 1),
        service.addItem(user2, productId, 1),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const reason = rejected[0].reason;
      const isExpected =
        reason instanceof ConflictException ||
        reason instanceof ServiceUnavailableException;
      expect(isExpected).toBe(true);

      const reservedMap = await service.getReservedQuantities([productId]);
      expect(reservedMap.get(productId)).toBe(1);
    } finally {
      await dataSource.destroy();
    }
  });
});
