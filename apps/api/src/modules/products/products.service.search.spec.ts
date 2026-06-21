import { NotFoundException } from '@nestjs/common';
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
};

const cartsStub = {
  getReservedQuantities: async (): Promise<ReservedMap> => new Map(),
} as unknown as CartsService;

type SeedProduct = Partial<Product> & {
  title: string;
  price: number;
  category: string;
  brand: string;
  rating: number;
  tags: string[];
};

function makeProduct(p: SeedProduct): Partial<Product> {
  return {
    description: p.description ?? 'desc',
    discountPercentage: 0,
    sku: p.sku ?? p.title,
    thumbnail: '',
    stock: p.stock ?? 50,
    lowStockThreshold: 10,
    availabilityStatus: 'In Stock',
    warrantyInformation: '',
    shippingInformation: '',
    returnPolicy: '',
    ...p,
  };
}

async function setup(seeds: SeedProduct[]): Promise<Ctx> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [Product, Review, ProductImage, User],
    synchronize: true,
    enableWAL: true,
  });
  await dataSource.initialize();

  const productRepo = dataSource.getRepository(Product);
  for (const seed of seeds) {
    await productRepo.save(productRepo.create(makeProduct(seed)));
  }

  const service = new ProductsService(
    productRepo,
    dataSource.getRepository(Review),
    cartsStub,
  );

  return { dataSource, service };
}

describe('ProductsService search/filter/sort', () => {
  it('filters by minPrice/maxPrice range', async () => {
    const { dataSource, service } = await setup([
      { title: 'Cheap', price: 5, category: 'a', brand: 'X', rating: 1, tags: [] },
      { title: 'Mid', price: 50, category: 'a', brand: 'X', rating: 1, tags: [] },
      { title: 'Pricey', price: 500, category: 'a', brand: 'X', rating: 1, tags: [] },
    ]);
    try {
      const res = await service.findAll({ minPrice: 10, maxPrice: 100 });
      expect(res.products.map((p) => p.title)).toEqual(['Mid']);
    } finally {
      await dataSource.destroy();
    }
  });

  it('filters by minRating', async () => {
    const { dataSource, service } = await setup([
      { title: 'Low', price: 10, category: 'a', brand: 'X', rating: 2, tags: [] },
      { title: 'High', price: 10, category: 'a', brand: 'X', rating: 4.5, tags: [] },
    ]);
    try {
      const res = await service.findAll({ minRating: 4 });
      expect(res.products.map((p) => p.title)).toEqual(['High']);
    } finally {
      await dataSource.destroy();
    }
  });

  it('filters by exact brand', async () => {
    const { dataSource, service } = await setup([
      { title: 'Acme1', price: 10, category: 'a', brand: 'ACME', rating: 1, tags: [] },
      { title: 'Other', price: 10, category: 'a', brand: 'OTHER', rating: 1, tags: [] },
      { title: 'AcmeCorp', price: 10, category: 'a', brand: 'ACME Corp', rating: 1, tags: [] },
    ]);
    try {
      const res = await service.findAll({ brand: 'ACME' });
      expect(res.products.map((p) => p.title)).toEqual(['Acme1']);
    } finally {
      await dataSource.destroy();
    }
  });

  it('filters by tag present in the tags array', async () => {
    const { dataSource, service } = await setup([
      { title: 'Tagged', price: 10, category: 'a', brand: 'X', rating: 1, tags: ['sale', 'new'] },
      { title: 'Untagged', price: 10, category: 'a', brand: 'X', rating: 1, tags: ['old'] },
    ]);
    try {
      const res = await service.findAll({ tag: 'sale' });
      expect(res.products.map((p) => p.title)).toEqual(['Tagged']);
    } finally {
      await dataSource.destroy();
    }
  });

  it('sorts by price ascending and descending', async () => {
    const seeds: SeedProduct[] = [
      { title: 'B', price: 20, category: 'a', brand: 'X', rating: 1, tags: [] },
      { title: 'A', price: 10, category: 'a', brand: 'X', rating: 1, tags: [] },
      { title: 'C', price: 30, category: 'a', brand: 'X', rating: 1, tags: [] },
    ];
    const { dataSource, service } = await setup(seeds);
    try {
      const asc = await service.findAll({ sort: 'price_asc' });
      expect(asc.products.map((p) => p.price)).toEqual([10, 20, 30]);

      const desc = await service.findAll({ sort: 'price_desc' });
      expect(desc.products.map((p) => p.price)).toEqual([30, 20, 10]);
    } finally {
      await dataSource.destroy();
    }
  });

  it('preserves existing category/search/lowStock/pagination behavior', async () => {
    const { dataSource, service } = await setup([
      { title: 'Alpha', price: 10, category: 'a', brand: 'X', rating: 1, tags: [], stock: 2, lowStockThreshold: 10 },
      { title: 'Beta', price: 10, category: 'b', brand: 'X', rating: 1, tags: [], stock: 99 },
    ]);
    try {
      const byCat = await service.findAll({ category: 'a' });
      expect(byCat.products.map((p) => p.title)).toEqual(['Alpha']);

      const bySearch = await service.findAll({ search: 'Bet' });
      expect(bySearch.products.map((p) => p.title)).toEqual(['Beta']);

      const lowStock = await service.findAll({ lowStock: true });
      expect(lowStock.products.map((p) => p.title)).toEqual(['Alpha']);

      const paged = await service.findAll({ limit: 1, skip: 1 });
      expect(paged.products).toHaveLength(1);
      expect(paged.total).toBe(2);
    } finally {
      await dataSource.destroy();
    }
  });
});

describe('ProductsService.getBrands', () => {
  it('returns distinct non-empty brands sorted ascending', async () => {
    const { dataSource, service } = await setup([
      { title: 'P1', price: 10, category: 'a', brand: 'Zebra', rating: 1, tags: [] },
      { title: 'P2', price: 10, category: 'a', brand: 'Apple', rating: 1, tags: [] },
      { title: 'P3', price: 10, category: 'a', brand: 'Apple', rating: 1, tags: [] },
      { title: 'P4', price: 10, category: 'a', brand: '', rating: 1, tags: [] },
    ]);
    try {
      const brands = await service.getBrands();
      expect(brands).toEqual(['Apple', 'Zebra']);
    } finally {
      await dataSource.destroy();
    }
  });
});

describe('ProductsService.findRelated', () => {
  it('returns same-category products excluding self, capped at 8, rating desc', async () => {
    const seeds: SeedProduct[] = [
      { title: 'Base', price: 10, category: 'tech', brand: 'X', rating: 3, tags: [] },
    ];
    // 10 related in same category with ascending ratings 1..10
    for (let i = 1; i <= 10; i++) {
      seeds.push({
        title: `Rel${i}`,
        price: 10,
        category: 'tech',
        brand: 'X',
        rating: i,
        tags: [],
      });
    }
    // a different-category product that must be excluded
    seeds.push({ title: 'Other', price: 10, category: 'food', brand: 'X', rating: 100, tags: [] });

    const { dataSource, service } = await setup(seeds);
    try {
      const base = await dataSource
        .getRepository(Product)
        .findOneByOrFail({ title: 'Base' });

      const related = await service.findRelated(base.id);

      expect(related).toHaveLength(8);
      // excludes self and other category
      expect(related.map((p) => p.title)).not.toContain('Base');
      expect(related.map((p) => p.title)).not.toContain('Other');
      // rating desc: top 8 of ratings 1..10 -> 10,9,...,3
      expect(related.map((p) => p.rating)).toEqual([10, 9, 8, 7, 6, 5, 4, 3]);
      // enriched with availableStock
      expect(related[0].availableStock).toBeDefined();
    } finally {
      await dataSource.destroy();
    }
  });

  it('throws NotFoundException when the base product does not exist', async () => {
    const { dataSource, service } = await setup([]);
    try {
      await expect(service.findRelated(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    } finally {
      await dataSource.destroy();
    }
  });
});
