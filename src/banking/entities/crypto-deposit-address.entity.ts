import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

// Admin-managed — not per-user. One row per supported cryptocurrency, each
// holding the single wallet address customers are shown when depositing via
// that currency. Updated in place by an admin (see AdminService), not
// recreated each time.
@Entity('crypto_deposit_addresses')
export class CryptoDepositAddress {
  @PrimaryGeneratedColumn()
  id: number;

  // Short code shown/stored as the identifier, e.g. 'BTC', 'ETH'.
  @Column({ unique: true })
  currency: string;

  // Display name, e.g. 'Bitcoin', 'Ethereum'.
  @Column()
  label: string;

  @Column()
  address: string;

  @UpdateDateColumn()
  updatedAt: Date;
}