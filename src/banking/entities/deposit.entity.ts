import { User } from 'src/users/entities/user.entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DepositMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CRYPTO = 'CRYPTO',
  // A correcting entry created automatically when an admin edits an
  // already-settled transaction's amount — see BankingService's
  // updateDepositDetails/updateWithdrawalDetails. Never chosen by a
  // customer directly.
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
}

export enum DepositStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('deposits')
export class Deposit {
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

  @Column({ type: 'enum', enum: DepositMethod })
  method: DepositMethod;

  @Column({ type: 'enum', enum: DepositStatus, default: DepositStatus.PENDING })
  status: DepositStatus;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}