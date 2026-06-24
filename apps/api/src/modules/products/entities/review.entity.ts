import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  rating!: number;

  @Column()
  comment!: string;

  @Column()
  reviewerName!: string;

  @Column()
  reviewerEmail!: string;

  @Column()
  date!: string;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE',
  })
  product!: Product;

  @Column({ type: 'int', nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { nullable: true })
  user!: User | null;
}
