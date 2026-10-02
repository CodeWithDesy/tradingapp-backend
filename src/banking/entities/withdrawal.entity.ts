import { User } from 'src/users/entities/user.entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WithdrawalMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CRYPTO = 'CRYPTO',
  // A correcting entry created automatically when an admin edits an
  // already-settled transaction's amount — see BankingService's
  // updateDepositDetails/updateWithdrawalDetails. Never chosen by a
  // customer directly.
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  // 0.5% of amount — informational (what portion of the withdrawal is fee vs
  // net-to-user). The wallet is debited by `amount`, not amount + fee.
  @Column('decimal', {
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  fee: number;

  @Column({ type: 'enum', enum: WithdrawalMethod })
  method: WithdrawalMethod;

  // Populated when method is BANK_TRANSFER; null otherwise.
  @Column({ nullable: true })
  bankAccountName: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  bankName: string;

  // Routing number, sort code, or SWIFT/BIC — whichever the user's bank uses.
  @Column({ nullable: true })
  bankRoutingNumber: string;

  // Populated when method is CRYPTO; null otherwise.
  @Column({ nullable: true })
  cryptoAddress: string;

  @Column({ type: 'enum', enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}