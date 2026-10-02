import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvestmentPlan } from 'src/investments/entities/investment-plan.entity';
import { User } from 'src/users/entities/user.entity/user.entity';

export enum UserInvestmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value),
};

@Entity('user_investments')
export class UserInvestment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 12, scale: 2, transformer: decimalTransformer })
  amount: number;

  // Principal + expected return, computed once at investment time from the
  // plan's expectedReturnPercentage at that moment.
  @Column('decimal', { precision: 12, scale: 2, transformer: decimalTransformer })
  expectedPayoutAmount: number;

  @Column({ type: 'timestamp' })
  maturityDate: Date;

  @Column({ type: 'enum', enum: UserInvestmentStatus, default: UserInvestmentStatus.ACTIVE })
  status: UserInvestmentStatus;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => InvestmentPlan)
  plan: InvestmentPlan;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}