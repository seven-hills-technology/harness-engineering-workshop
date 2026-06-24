import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Review } from './review.entity';
import { ProductImage } from './product-image.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({ type: 'real' })
  price!: number;

  @Column({ type: 'real' })
  discountPercentage!: number;

  @Column()
  category!: string;

  @Column()
  brand!: string;

  @Column()
  sku!: string;

  @Column()
  thumbnail!: string;

  @Column({ type: 'real' })
  rating!: number;

  @Column({ type: 'int' })
  stock!: number;

  @Column({ type: 'int', default: 10 })
  lowStockThreshold!: number;

  @Column()
  availabilityStatus!: string;

  @Column({ type: 'simple-json' })
  tags!: string[];

  @Column()
  warrantyInformation!: string;

  @Column()
  shippingInformation!: string;

  @Column()
  returnPolicy!: string;

  @OneToMany(() => Review, (review) => review.product, { cascade: true })
  reviews!: Review[];

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images!: ProductImage[];
}
