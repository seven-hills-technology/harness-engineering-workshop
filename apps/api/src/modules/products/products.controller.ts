import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { ProductsService } from './products.service';
import {
  BulkAdjustInput,
  BulkAdjustResult,
  CreateReviewInput,
  InventoryUpdateInput,
  ProductDetail,
  ProductListItem,
  ProductListQuery,
  ProductListResponse,
  ProductSort,
} from './product.types';
import { Product } from './entities/product.entity';

type AuthedRequest = Request & { user: AuthenticatedUser };

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: ProductListQuery): Promise<ProductListResponse> {
    return this.products.findAll({
      ...query,
      skip: query.skip ? Number(query.skip) : 0,
      limit: query.limit ? Math.min(Number(query.limit), 100) : 20,
      lowStock: query.lowStock,
      minPrice: this.parseNumber(query.minPrice),
      maxPrice: this.parseNumber(query.maxPrice),
      minRating: this.parseNumber(query.minRating),
      brand: query.brand,
      tag: query.tag,
      sort: this.parseSort(query.sort),
    });
  }

  @Get('categories')
  categories(): Promise<string[]> {
    return this.products.getCategories();
  }

  @Get('brands')
  brands(): Promise<string[]> {
    return this.products.getBrands();
  }

  @UseGuards(AdminGuard)
  @Post('inventory/bulk')
  bulkAdjust(@Body() input: BulkAdjustInput): Promise<BulkAdjustResult> {
    return this.products.bulkAdjust(input);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/inventory')
  updateInventory(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: InventoryUpdateInput,
  ): Promise<Product> {
    return this.products.updateInventory(id, input);
  }

  @Get(':id/related')
  related(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductListItem[]> {
    return this.products.findRelated(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductDetail> {
    return this.products.findOne(id);
  }

  @Post(':id/reviews')
  addReview(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateReviewInput,
  ): Promise<ProductDetail> {
    return this.products.addReview(id, req.user.id, req.user.email, body);
  }

  private parseNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseSort(value: unknown): ProductSort | undefined {
    const allowed: ProductSort[] = [
      'price_asc',
      'price_desc',
      'rating_desc',
      'title_asc',
    ];
    return allowed.includes(value as ProductSort)
      ? (value as ProductSort)
      : undefined;
  }
}
