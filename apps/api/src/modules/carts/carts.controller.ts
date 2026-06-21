import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { AddItemInput, CartView, UpdateItemInput } from './cart.types';
import { CartsService } from './carts.service';

type AuthedRequest = Request & { user: AuthenticatedUser };

@Controller('cart')
export class CartsController {
  constructor(private readonly carts: CartsService) {}

  @Get()
  get(@Req() req: AuthedRequest): Promise<CartView> {
    return this.carts.getCart(req.user.id);
  }

  @Post('items')
  addItem(
    @Req() req: AuthedRequest,
    @Body() body: AddItemInput,
  ): Promise<CartView> {
    return this.carts.addItem(req.user.id, body.productId, body.quantity);
  }

  @Patch('items/:productId')
  updateItem(
    @Req() req: AuthedRequest,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: UpdateItemInput,
  ): Promise<CartView> {
    return this.carts.updateItem(req.user.id, productId, body.quantity);
  }

  @Delete('items/:productId')
  removeItem(
    @Req() req: AuthedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<CartView> {
    return this.carts.removeItem(req.user.id, productId);
  }

  @Delete()
  clear(@Req() req: AuthedRequest): Promise<CartView> {
    return this.carts.clearCart(req.user.id);
  }
}
