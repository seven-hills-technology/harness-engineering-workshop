import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { OrdersService } from './orders.service';
import { OrderView } from './orders.types';

type AuthedRequest = Request & { user: AuthenticatedUser };

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  checkout(@Req() req: AuthedRequest): Promise<OrderView> {
    return this.orders.checkout(req.user.id);
  }

  @Get()
  list(@Req() req: AuthedRequest): Promise<OrderView[]> {
    return this.orders.listOrders(req.user.id);
  }

  @Get(':id')
  get(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<OrderView> {
    return this.orders.getOrder(req.user.id, id);
  }
}
