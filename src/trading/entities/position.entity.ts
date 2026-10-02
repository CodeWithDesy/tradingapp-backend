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

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value),
};

// One row per (user, market) — created on a user's first buy in a market,
// updated on every subsequent trade, and deleted once quantity reaches zero
// (a fully closed position isn't really a "position" anymore — the history
// of how it closed lives in Trade, not here).
@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 18, scale: 8, transformer: decimalTransformer })
  quantity: number;

  // Volume-weighted average price paid across all BUYs that built this
  // position. Unchanged by SELLs — selling reduces quantity, not the
  // average cost of what remains.
  @Column('decimal', { precision: 14, scale: 4, transformer: decimalTransformer })
  averageEntryPrice: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Market)
  market: Market;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}