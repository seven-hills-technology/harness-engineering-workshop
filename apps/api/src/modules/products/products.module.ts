import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Review } from './entities/review.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SeedService } from './seed.service';
import { CartsModule } from '../carts/carts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Review, ProductImage]),
    CartsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, SeedService],
})
export class ProductsModule {}
