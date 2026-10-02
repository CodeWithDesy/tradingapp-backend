import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Market } from 'src/trading/entities/market.entity';
import { User } from 'src/users/entities/user.entity/user.entity';

export enum TradeSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value),
};

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TradeSide })
  side: TradeSide;

  // Generous precision — fractional crypto units need many decimal places.
  @Column('decimal', { precision: 18, scale: 8, transformer: decimalTransformer })
  quantity: number;

  // The market's currentPrice at the moment this trade executed.
  @Column('decimal', { precision: 14, scale: 4, transformer: decimalTransformer })
  price: number;

  // quantity * price, rounded to money precision — this is what actually
  // moves in or out of the wallet.
  @Column('decimal', { precision: 12, scale: 2, transformer: decimalTransformer })
  total: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Market)
  market: Market;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}