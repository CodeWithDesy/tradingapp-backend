import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum MarketCategory { FOREX = 'FOREX', CRYPTO = 'CRYPTO', COMMODITIES = 'COMMODITIES', INDICES = 'INDICES' }

const priceTransformer = { to: (v: number) => v, from: (v: string) => parseFloat(v) };

@Entity('markets')
export class Market {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: MarketCategory })
  category: MarketCategory;

  @Column('decimal', { precision: 14, scale: 4, transformer: priceTransformer })
  currentPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}