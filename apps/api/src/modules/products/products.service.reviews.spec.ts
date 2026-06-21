import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CartsService } from '../carts/carts.service';
import { ReservedMap } from '../carts/cart.types';
import { Product } from './entities/product.entity';
import { Review } from './entities/review.entity';
import { ProductImage } from './entities/product-image.entity';
import { User } from '../users/entities/user.entity';
import { ProductsService } from './products.service';

type Ctx = {
  dataSource: DataSource;
  service: ProductsService;
  userId: number;
  userEmail: string;
  product: Product;
};

// Lightweight stand-in for CartsService: addReview / findOne only need
// getReservedQuantities, which returns an empty reservation map here.
const cartsStub = {
  getReservedQuantities: async (): Promise<ReservedMap> => new Map(),
} as unknown as CartsService;

async function setup(): Promise<Ctx> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [Product, Review, ProductImage, User],
    synchronize: true,
    enableWAL: true,
  });
  await dataSource.initialize();

  const productRepo = dataSource.getRepository(Product);
  const product = await productRepo.save(
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

  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.save(
    userRepo.create({
      email: 'reviewer@test.com',
      passwordHash: 'x',
      isAdmin: false,
    }),
  );

  const service = new ProductsService(
    productRepo,
    dataSource.getRepository(Review),
    cartsStub,
  );

  return {
    dataSource,
    service,
    userId: user.id,
    userEmail: user.email,
    product,
  };
}

describe('ProductsService.addReview', () => {
  it('creates a review linked to the user and returns it in ProductDetail.reviews', async () => {
    const { dataSource, service, userId, userEmail, product } = await setup();
    try {
      const detail = await service.addReview(product.id, userId, userEmail, {
        rating: 4,
        comment: 'Solid widget',
      });

      expect(detail.reviews).toHaveLength(1);
      const review = detail.reviews[0];
      expect(review.rating).toBe(4);
      expect(review.comment).toBe('Solid widget');
      expect(review.reviewerName).toBe(userEmail);
      expect(review.reviewerEmail).toBe(userEmail);
      expect(review.userId).toBe(userId);

      // Persisted with the user link.
      const persisted = await dataSource
        .getRepository(Review)
        .findOneOrFail({ where: { id: review.id } });
      expect(persisted.userId).toBe(userId);
    } finally {
      await dataSource.destroy();
    }
  });

  it('recomputes product.rating to the new average after adding a review', async () => {
    const { dataSource, service, userId, userEmail, product } = await setup();
    try {
      await service.addReview(product.id, userId, userEmail, {
        rating: 2,
        comment: 'meh',
      });
      let detail = await service.addReview(product.id, userId, userEmail, {
        rating: 5,
        comment: 'great',
      });

      // (2 + 5) / 2 = 3.5
      expect(detail.rating).toBe(3.5);

      detail = await service.addReview(product.id, userId, userEmail, {
        rating: 4,
        comment: 'good',
      });

      // (2 + 5 + 4) / 3 = 3.6666... -> rounded to 2 decimals
      expect(detail.rating).toBe(3.67);
    } finally {
      await dataSource.destroy();
    }
  });

  it.each([0, 6, 3.5])(
    'throws BadRequestException for out-of-range / non-integer rating %p',
    async (rating) => {
      const { dataSource, service, userId, userEmail, product } = await setup();
      try {
        await expect(
          service.addReview(product.id, userId, userEmail, {
            rating: rating as number,
            comment: 'whatever',
          }),
        ).rejects.toBeInstanceOf(BadRequestException);

        // No review persisted, rating unchanged.
        expect(await dataSource.getRepository(Review).count()).toBe(0);
        const refreshed = await dataSource
          .getRepository(Product)
          .findOneByOrFail({ id: product.id });
        expect(refreshed.rating).toBe(0);
      } finally {
        await dataSource.destroy();
      }
    },
  );

  it('throws BadRequestException for an empty comment', async () => {
    const { dataSource, service, userId, userEmail, product } = await setup();
    try {
      await expect(
        service.addReview(product.id, userId, userEmail, {
          rating: 4,
          comment: '   ',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(await dataSource.getRepository(Review).count()).toBe(0);
    } finally {
      await dataSource.destroy();
    }
  });

  it('throws NotFoundException for an unknown productId', async () => {
    const { dataSource, service, userId, userEmail } = await setup();
    try {
      await expect(
        service.addReview(999999, userId, userEmail, {
          rating: 4,
          comment: 'ghost product',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    } finally {
      await dataSource.destroy();
    }
  });
});
