import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './modules/products/products.module';
import { Product } from './modules/products/entities/product.entity';
import { Review } from './modules/products/entities/review.entity';
import { ProductImage } from './modules/products/entities/product-image.entity';
import { User } from './modules/users/entities/user.entity';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CartsModule } from './modules/carts/carts.module';
import { Cart } from './modules/carts/entities/cart.entity';
import { CartItem } from './modules/carts/entities/cart-item.entity';
import { OrdersModule } from './modules/orders/orders.module';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'db/workshop.sqlite',
      entities: [
        Product,
        Review,
        ProductImage,
        User,
        Cart,
        CartItem,
        Order,
        OrderItem,
      ],
      synchronize: true,
      enableWAL: true,
    }),
    ProductsModule,
    UsersModule,
    AuthModule,
    CartsModule,
    OrdersModule,
  ],
})
export class AppModule {}
