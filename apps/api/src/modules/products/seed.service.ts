import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Review } from './entities/review.entity';
import { ProductImage } from './entities/product-image.entity';

type DummyJsonReview = {
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerEmail: string;
  date: string;
};

type DummyJsonProduct = {
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  category: string;
  brand: string;
  sku: string;
  thumbnail: string;
  rating: number;
  stock: number;
  availabilityStatus: string;
  tags: string[];
  warrantyInformation: string;
  shippingInformation: string;
  returnPolicy: string;
  reviews: DummyJsonReview[];
  images: string[];
};

type DummyJsonResponse = {
  products: DummyJsonProduct[];
};

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const count = await this.productRepo.count();
      if (count > 0) {
        this.logger.log(`Database already seeded with ${count} products`);
        return;
      }

      this.logger.log('Seeding products from DummyJSON...');

      const response = await fetch(
        'https://dummyjson.com/products?limit=194',
      );
      if (!response.ok) {
        throw new Error(`DummyJSON returned ${response.status}`);
      }
      const data = (await response.json()) as DummyJsonResponse;

      const products = data.products.map((item) => {
        const product = new Product();
        product.title = item.title;
        product.description = item.description;
        product.price = item.price;
        product.discountPercentage = item.discountPercentage;
        product.category = item.category;
        product.brand = item.brand ?? '';
        product.sku = item.sku;
        product.thumbnail = item.thumbnail;
        product.rating = item.rating;
        product.stock = item.stock;
        product.lowStockThreshold = 10;
        product.availabilityStatus = item.availabilityStatus;
        product.tags = item.tags;
        product.warrantyInformation = item.warrantyInformation;
        product.shippingInformation = item.shippingInformation;
        product.returnPolicy = item.returnPolicy;

        product.reviews = (item.reviews ?? []).map((r) => {
          const review = new Review();
          review.rating = r.rating;
          review.comment = r.comment;
          review.reviewerName = r.reviewerName;
          review.reviewerEmail = r.reviewerEmail;
          review.date = r.date;
          return review;
        });

        product.images = (item.images ?? []).map((url) => {
          const image = new ProductImage();
          image.url = url;
          return image;
        });

        return product;
      });

      await this.productRepo.save(products);
      this.logger.log(`Seeded ${products.length} products`);
    } catch (error) {
      this.logger.warn(
        `Failed to seed products: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
