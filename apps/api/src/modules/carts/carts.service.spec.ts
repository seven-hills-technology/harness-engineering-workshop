import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { CartsService } from './carts.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { RESERVATION_TTL_MS } from './carts.constants';

type Mocked<T> = { [K in keyof T]: jest.Mock };

type StubQueryRunner = {
  calls: string[];
  connect: jest.Mock;
  query: jest.Mock;
  release: jest.Mock;
  manager: EntityManager;
};

function makeCart(overrides: Partial<Cart> = {}): Cart {
  const cart = new Cart();
  cart.id = overrides.id ?? 100;
  cart.userId = overrides.userId ?? 1;
  cart.reservedAt = overrides.reservedAt ?? null;
  cart.createdAt = overrides.createdAt ?? new Date();
  cart.items = overrides.items ?? [];
  return cart;
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  const p = new Product();
  p.id = overrides.id ?? 10;
  p.title = overrides.title ?? 'Widget';
  p.description = overrides.description ?? 'A widget';
  p.price = overrides.price ?? 9.99;
  p.discountPercentage = overrides.discountPercentage ?? 0;
  p.category = overrides.category ?? 'general';
  p.brand = overrides.brand ?? 'ACME';
  p.sku = overrides.sku ?? 'SKU-1';
  p.thumbnail = overrides.thumbnail ?? 'thumb.png';
  p.rating = overrides.rating ?? 4;
  p.stock = overrides.stock ?? 5;
  p.lowStockThreshold = overrides.lowStockThreshold ?? 10;
  p.availabilityStatus = overrides.availabilityStatus ?? 'In Stock';
  p.tags = overrides.tags ?? [];
  p.warrantyInformation = overrides.warrantyInformation ?? '';
  p.shippingInformation = overrides.shippingInformation ?? '';
  p.returnPolicy = overrides.returnPolicy ?? '';
  p.reviews = overrides.reviews ?? [];
  p.images = overrides.images ?? [];
  return p;
}

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  const item = new CartItem();
  item.id = overrides.id ?? 1;
  item.cartId = overrides.cartId ?? 100;
  item.productId = overrides.productId ?? 10;
  item.quantity = overrides.quantity ?? 1;
  if (overrides.product) {
    item.product = overrides.product;
  }
  return item;
}

type StubReservedRow = { productId?: number; reserved: number | string };

function buildStubManager(opts: {
  product?: Product | null;
  existingItem?: CartItem | null;
  sumReserved?: number;
  groupedReserved?: StubReservedRow[];
  savedItems: CartItem[];
  savedCarts: Cart[];
}): EntityManager {
  const manager = {
    findOne: jest.fn(async (entity: unknown, _q: unknown) => {
      if (entity === Product) {
        return opts.product ?? null;
      }
      if (entity === CartItem) {
        return opts.existingItem ?? null;
      }
      return null;
    }),
    insert: jest.fn(async (entity: unknown, payload: unknown) => {
      if (entity === CartItem) {
        const item = new CartItem();
        Object.assign(item, payload);
        opts.savedItems.push(item);
      }
      return { identifiers: [{ id: 1 }] };
    }),
    update: jest.fn(
      async (entity: unknown, _where: unknown, patch: Record<string, unknown>) => {
        if (entity === CartItem) {
          const item = new CartItem();
          Object.assign(item, opts.existingItem ?? {}, patch);
          opts.savedItems.push(item);
        }
        if (entity === Cart) {
          const cart = new Cart();
          Object.assign(cart, patch);
          opts.savedCarts.push(cart);
        }
        return { affected: 1 };
      },
    ),
    save: jest.fn(async (entity: unknown, payload: unknown) => {
      if (entity === CartItem) {
        opts.savedItems.push(payload as CartItem);
      }
      if (entity === Cart) {
        opts.savedCarts.push(payload as Cart);
      }
      return payload;
    }),
    create: jest.fn((_entity: unknown, payload: Partial<CartItem>) => {
      const item = new CartItem();
      Object.assign(item, payload);
      return item;
    }),
    createQueryBuilder: jest.fn(() => {
      const row: StubReservedRow = { reserved: opts.sumReserved ?? 0 };
      const qb = {
        innerJoin: () => qb,
        select: () => qb,
        addSelect: () => qb,
        where: () => qb,
        andWhere: () => qb,
        groupBy: () => qb,
        getRawOne: async () => row,
        getRawMany: async () => opts.groupedReserved ?? [],
      };
      return qb;
    }),
  } as unknown as EntityManager;
  return manager;
}

function buildQueryRunner(manager: EntityManager): StubQueryRunner {
  const calls: string[] = [];
  return {
    calls,
    connect: jest.fn(async () => undefined),
    query: jest.fn(async (sql: string) => {
      calls.push(sql);
    }),
    release: jest.fn(async () => undefined),
    manager,
  };
}

type Repos = {
  cartRepo: Mocked<Repository<Cart>>;
  itemRepo: Mocked<Repository<CartItem>>;
  productRepo: Mocked<Repository<Product>>;
};

function buildRepos(): Repos {
  const cartRepo = {
    findOne: jest.fn(),
    create: jest.fn((input: Partial<Cart>) => {
      const c = new Cart();
      Object.assign(c, input);
      return c;
    }),
    save: jest.fn(async (c: Cart) => c),
    update: jest.fn(async () => ({ affected: 1 })),
  } as unknown as Mocked<Repository<Cart>>;

  const itemRepo = {
    find: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(async () => ({ affected: 1 })),
    createQueryBuilder: jest.fn(),
  } as unknown as Mocked<Repository<CartItem>>;

  const productRepo = {
    findOne: jest.fn(),
  } as unknown as Mocked<Repository<Product>>;

  return { cartRepo, itemRepo, productRepo };
}

function buildDataSource(qr: StubQueryRunner): DataSource {
  return {
    createQueryRunner: jest.fn(() => qr),
  } as unknown as DataSource;
}

function installListReserved(
  repos: Repos,
  rows: StubReservedRow[],
): void {
  repos.itemRepo.createQueryBuilder.mockImplementation(() => {
    const qb = {
      innerJoin: () => qb,
      select: () => qb,
      addSelect: () => qb,
      where: () => qb,
      andWhere: () => qb,
      groupBy: () => qb,
      getRawMany: async () => rows,
      getRawOne: async () => rows[0] ?? { reserved: 0 },
    };
    return qb;
  });
}

type ErrorCtor = abstract new (...args: never[]) => Error;

async function expectThrows(
  fn: () => Promise<unknown>,
  type: ErrorCtor,
): Promise<Error> {
  let caught: unknown = null;
  try {
    await fn();
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(type);
  return caught as Error;
}

describe('CartsService', () => {
  describe('addItem', () => {
    it('throws BadRequestException for non-integer quantity', async () => {
      const repos = buildRepos();
      const qr = buildQueryRunner(
        buildStubManager({ savedItems: [], savedCarts: [] }),
      );
      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      await expectThrows(
        () => service.addItem(1, 10, 1.5),
        BadRequestException,
      );
    });

    it('sets reservedAt on empty cart and creates a new line', async () => {
      const repos = buildRepos();
      const cart = makeCart({ reservedAt: null });
      const product = makeProduct({ stock: 5 });
      repos.cartRepo.findOne.mockImplementation(async () => cart);

      const savedItems: CartItem[] = [];
      const savedCarts: Cart[] = [];
      const manager = buildStubManager({
        product,
        existingItem: null,
        sumReserved: 0,
        savedItems,
        savedCarts,
      });
      const qr = buildQueryRunner(manager);

      repos.itemRepo.find.mockResolvedValue([
        makeItem({ productId: 10, quantity: 2, product }),
      ]);
      installListReserved(repos, [{ productId: 10, reserved: 2 }]);

      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      const view = await service.addItem(1, 10, 2);

      expect(qr.calls[0]).toBe('BEGIN IMMEDIATE');
      expect(qr.calls.includes('COMMIT')).toBe(true);
      expect(savedItems.length >= 1).toBe(true);
      const cartSaved = savedCarts.find((c) => c.reservedAt instanceof Date);
      expect(cartSaved).toBeDefined();
      expect(view.items.length).toBe(1);
      expect(view.items[0].productId).toBe(10);
      expect(view.items[0].quantity).toBe(2);
      expect(view.items[0].title).toBe('Widget');
      expect(view.expiresAt === null).toBe(false);
    });

    it('increments existing line and does not touch reservedAt', async () => {
      const repos = buildRepos();
      const originalReservedAt = new Date(Date.now() - 60_000);
      const cart = makeCart({ reservedAt: originalReservedAt });
      const product = makeProduct({ stock: 10 });
      const existing = makeItem({
        productId: 10,
        quantity: 2,
        cartId: cart.id,
      });
      repos.cartRepo.findOne.mockImplementation(async () => cart);

      const savedItems: CartItem[] = [];
      const savedCarts: Cart[] = [];
      const manager = buildStubManager({
        product,
        existingItem: existing,
        sumReserved: 2,
        savedItems,
        savedCarts,
      });
      const qr = buildQueryRunner(manager);

      repos.itemRepo.find.mockResolvedValue([
        makeItem({ productId: 10, quantity: 5, product }),
      ]);
      installListReserved(repos, [{ productId: 10, reserved: 5 }]);

      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      await service.addItem(1, 10, 3);

      expect(savedItems[0].quantity).toBe(5);
      const cartsChanged = savedCarts.filter(
        (c) => c.reservedAt !== originalReservedAt,
      );
      expect(cartsChanged.length).toBe(0);
    });

    it('does not change reservedAt on cart with other active items', async () => {
      const repos = buildRepos();
      const originalReservedAt = new Date(Date.now() - 120_000);
      const cart = makeCart({ reservedAt: originalReservedAt });
      const product = makeProduct({ stock: 10, id: 11 });
      repos.cartRepo.findOne.mockImplementation(async () => cart);

      const savedItems: CartItem[] = [];
      const savedCarts: Cart[] = [];
      const manager = buildStubManager({
        product,
        existingItem: null,
        sumReserved: 0,
        savedItems,
        savedCarts,
      });
      const qr = buildQueryRunner(manager);

      repos.itemRepo.find.mockResolvedValue([]);
      installListReserved(repos, []);

      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      await service.addItem(1, 11, 1);

      const cartsChanged = savedCarts.filter(
        (c) => c.reservedAt !== originalReservedAt,
      );
      expect(cartsChanged.length).toBe(0);
    });

    it('throws ConflictException with "Only N available" on over-add', async () => {
      const repos = buildRepos();
      const cart = makeCart({ reservedAt: new Date() });
      const product = makeProduct({ stock: 3 });
      repos.cartRepo.findOne.mockImplementation(async () => cart);

      const manager = buildStubManager({
        product,
        existingItem: null,
        sumReserved: 2,
        savedItems: [],
        savedCarts: [],
      });
      const qr = buildQueryRunner(manager);

      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      const err = await expectThrows(
        () => service.addItem(1, 10, 5),
        ConflictException,
      );
      expect(err.message).toBe('Only 1 available');
      expect(qr.calls.includes('ROLLBACK')).toBe(true);
    });

    it('throws NotFoundException when product missing', async () => {
      const repos = buildRepos();
      const cart = makeCart({ reservedAt: null });
      repos.cartRepo.findOne.mockImplementation(async () => cart);
      const manager = buildStubManager({
        product: null,
        existingItem: null,
        sumReserved: 0,
        savedItems: [],
        savedCarts: [],
      });
      const qr = buildQueryRunner(manager);

      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      await expectThrows(
        () => service.addItem(1, 999, 1),
        NotFoundException,
      );
    });
  });

  describe('updateItem', () => {
    it('quantity === 0 routes to removeItem and nulls reservedAt when empty', async () => {
      const repos = buildRepos();
      const cart = makeCart({ reservedAt: new Date() });
      repos.cartRepo.findOne.mockImplementation(async () => cart);
      repos.itemRepo.count.mockResolvedValue(0);
      repos.itemRepo.find.mockResolvedValue([]);

      const qr = buildQueryRunner(
        buildStubManager({ savedItems: [], savedCarts: [] }),
      );
      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      const view = await service.updateItem(1, 10, 0);

      expect(repos.itemRepo.delete).toHaveBeenCalledWith({
        cartId: cart.id,
        productId: 10,
      });
      expect(repos.cartRepo.update).toHaveBeenCalledWith(
        { id: cart.id },
        { reservedAt: null },
      );
      expect(view.items.length).toBe(0);
      expect(view.expiresAt).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('nulls reservedAt when cart becomes empty', async () => {
      const repos = buildRepos();
      const cart = makeCart({ reservedAt: new Date() });
      repos.cartRepo.findOne.mockImplementation(async () => cart);
      repos.itemRepo.count.mockResolvedValue(0);
      repos.itemRepo.find.mockResolvedValue([]);

      const qr = buildQueryRunner(
        buildStubManager({ savedItems: [], savedCarts: [] }),
      );
      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      const view = await service.removeItem(1, 10);

      expect(repos.itemRepo.delete).toHaveBeenCalledWith({
        cartId: cart.id,
        productId: 10,
      });
      expect(repos.cartRepo.update).toHaveBeenCalledWith(
        { id: cart.id },
        { reservedAt: null },
      );
      expect(view.expiresAt).toBeNull();
    });
  });

  describe('getCart', () => {
    it('on expired cart deletes rows, nulls reservedAt, returns justExpired', async () => {
      const repos = buildRepos();
      const expired = new Date(Date.now() - (RESERVATION_TTL_MS + 1_000));
      const cart = makeCart({ reservedAt: expired });
      repos.cartRepo.findOne.mockImplementation(async () => cart);
      const product = makeProduct();
      repos.itemRepo.find.mockResolvedValue([
        makeItem({ productId: 10, quantity: 1, product }),
      ]);

      const qr = buildQueryRunner(
        buildStubManager({ savedItems: [], savedCarts: [] }),
      );
      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      const view = await service.getCart(1);

      expect(repos.itemRepo.delete).toHaveBeenCalledWith({ cartId: cart.id });
      expect(repos.cartRepo.update).toHaveBeenCalledWith(
        { id: cart.id },
        { reservedAt: null },
      );
      expect(view.items.length).toBe(0);
      expect(view.expiresAt).toBeNull();
      expect(view.justExpired).toBe(true);
    });
  });

  describe('getReservedQuantities', () => {
    it('sums quantities from active carts; returns a Map', async () => {
      const repos = buildRepos();
      installListReserved(repos, [
        { productId: 10, reserved: '4' },
        { productId: 11, reserved: '1' },
      ]);

      const qr = buildQueryRunner(
        buildStubManager({ savedItems: [], savedCarts: [] }),
      );
      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      const map = await service.getReservedQuantities([10, 11, 12]);
      expect(map.get(10)).toBe(4);
      expect(map.get(11)).toBe(1);
      expect(map.get(12)).toBeUndefined();
    });

    it('returns empty map for empty input without querying', async () => {
      const repos = buildRepos();
      const qr = buildQueryRunner(
        buildStubManager({ savedItems: [], savedCarts: [] }),
      );
      const service = new CartsService(
        repos.cartRepo as unknown as Repository<Cart>,
        repos.itemRepo as unknown as Repository<CartItem>,
        repos.productRepo as unknown as Repository<Product>,
        buildDataSource(qr),
      );

      const map = await service.getReservedQuantities([]);
      expect(map.size).toBe(0);
      expect(repos.itemRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
