import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CartsService } from '../carts/carts.service';
import { ReservedMap } from '../carts/cart.types';
import { Product } from './entities/product.entity';
import { Review } from './entities/review.entity';
import {
  BulkAdjustInput,
  BulkAdjustFailure,
  BulkAdjustResult,
  BulkAdjustSuccess,
  CreateReviewInput,
  InventoryUpdateInput,
  ProductDetail,
  ProductListItem,
  ProductListQuery,
  ProductListResponse,
} from './product.types';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly cartsService: CartsService,
  ) {}

  async findAll(query: ProductListQuery): Promise<ProductListResponse> {
    const skip = query.skip ?? 0;
    const limit = query.limit ?? 20;

    const qb = this.productRepo.createQueryBuilder('product');

    if (query.category) {
      qb.andWhere('product.category = :category', {
        category: query.category,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(product.title LIKE :search OR product.description LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.lowStock === true || query.lowStock === 'true') {
      qb.andWhere('product.stock <= product.lowStockThreshold');
    }

    qb.orderBy('product.id', 'ASC').skip(skip).take(limit);

    const [products, total] = await qb.getManyAndCount();

    const reserved = await this.cartsService.getReservedQuantities(
      products.map((p) => p.id),
    );

    const items: ProductListItem[] = products.map((product) =>
      this.withAvailability(product, reserved),
    );

    return { products: items, total, skip, limit };
  }

  async findOne(id: number): Promise<ProductDetail> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['reviews', 'images'],
    });

    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    const reserved = await this.cartsService.getReservedQuantities([id]);
    return this.withAvailability(product, reserved);
  }

  async addReview(
    productId: number,
    userId: number,
    userEmail: string,
    input: CreateReviewInput,
  ): Promise<ProductDetail> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product #${productId} not found`);
    }

    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Invalid request body');
    }

    const { rating, comment } = input;

    if (
      typeof rating !== 'number' ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      throw new BadRequestException('rating must be an integer between 1 and 5');
    }

    if (typeof comment !== 'string' || comment.trim().length === 0) {
      throw new BadRequestException('comment must be a non-empty string');
    }

    const review = this.reviewRepo.create({
      rating,
      comment: comment.trim(),
      reviewerName: userEmail,
      reviewerEmail: userEmail,
      date: new Date().toISOString(),
      product,
      userId,
    });
    await this.reviewRepo.save(review);

    // Recompute the average in SQL (read-consistent, constant memory; avoids
    // cascading the stale reviews collection on the loaded product).
    const { avg } = (await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.productId = :productId', { productId })
      .getRawOne<{ avg: number | string | null }>()) ?? { avg: 0 };
    const average = avg === null ? 0 : Number(avg);
    await this.productRepo.update(productId, {
      rating: Math.round(average * 100) / 100,
    });

    return this.findOne(productId);
  }

  async getCategories(): Promise<string[]> {
    const results = await this.productRepo
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'category')
      .orderBy('product.category', 'ASC')
      .getRawMany<{ category: string }>();

    return results.map((r) => r.category);
  }

  async updateInventory(
    id: number,
    input: InventoryUpdateInput,
  ): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    if (input.stock !== undefined) {
      if (typeof input.stock !== 'number' || !Number.isFinite(input.stock)) {
        throw new BadRequestException('stock must be a number');
      }
      if (input.stock < 0) {
        throw new BadRequestException('stock must be >= 0');
      }
      product.stock = input.stock;
    }

    if (input.lowStockThreshold !== undefined) {
      if (
        typeof input.lowStockThreshold !== 'number' ||
        !Number.isFinite(input.lowStockThreshold)
      ) {
        throw new BadRequestException('lowStockThreshold must be a number');
      }
      if (input.lowStockThreshold < 0) {
        throw new BadRequestException('lowStockThreshold must be >= 0');
      }
      product.lowStockThreshold = input.lowStockThreshold;
    }

    const saved = await this.productRepo.save(product);
    saved.availabilityStatus = this.computeAvailability(
      saved.stock,
      saved.lowStockThreshold,
    );
    return saved;
  }

  async bulkAdjust(input: BulkAdjustInput): Promise<BulkAdjustResult> {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Invalid request body');
    }

    const { productIds, operation, value } = input;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new BadRequestException('productIds must be a non-empty array');
    }

    if (!productIds.every((id) => typeof id === 'number' && Number.isInteger(id))) {
      throw new BadRequestException('productIds must contain integers');
    }

    if (
      operation !== 'set' &&
      operation !== 'add' &&
      operation !== 'subtract'
    ) {
      throw new BadRequestException(
        "operation must be one of 'set' | 'add' | 'subtract'",
      );
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new BadRequestException('value must be a number');
    }

    const products = await this.productRepo.find({
      where: { id: In(productIds) },
    });
    const productMap = new Map<number, Product>(
      products.map((p) => [p.id, p]),
    );

    const succeeded: BulkAdjustSuccess[] = [];
    const failed: BulkAdjustFailure[] = [];
    const toSave: Product[] = [];

    for (const id of productIds) {
      const product = productMap.get(id);
      if (!product) {
        failed.push({ id, reason: 'product not found' });
        continue;
      }

      let newStock: number;
      switch (operation) {
        case 'set':
          newStock = value;
          break;
        case 'add':
          newStock = product.stock + value;
          break;
        case 'subtract':
          newStock = product.stock - value;
          break;
      }

      if (newStock < 0) {
        failed.push({ id, reason: 'would result in negative stock' });
        continue;
      }

      product.stock = newStock;
      toSave.push(product);
      succeeded.push({ id, stock: newStock });
    }

    if (toSave.length > 0) {
      await this.productRepo.save(toSave);
    }

    return { succeeded, failed };
  }

  private withAvailability<T extends Product>(
    product: T,
    reserved: ReservedMap,
  ): T & { availableStock: number; reservedStock: number } {
    const reservedStock = reserved.get(product.id) ?? 0;
    const availableStock = Math.max(product.stock - reservedStock, 0);
    product.availabilityStatus = this.computeAvailability(
      availableStock,
      product.lowStockThreshold,
    );
    return Object.assign(product, { availableStock, reservedStock });
  }

  private computeAvailability(stock: number, threshold: number): string {
    if (stock === 0) {
      return 'Out of Stock';
    }
    if (stock <= threshold) {
      return 'Low Stock';
    }
    return 'In Stock';
  }
}
