import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../carts/entities/cart-item.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderSeedService } from './order-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, User, Cart, CartItem]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderSeedService],
  exports: [OrdersService],
})
export class OrdersModule {}
