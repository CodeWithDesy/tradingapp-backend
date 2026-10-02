import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum InvestmentRiskLevel { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH' }
export enum InvestmentPlanStatus { OPEN = 'OPEN', CLOSED = 'CLOSED' }

const decimalTransformer = { to: (v: number) => v, from: (v: string) => parseFloat(v) };

@Entity('investment_plans')
export class InvestmentPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Plain string, not an enum — business content an admin will manage
  // (Stage 7), not a fixed technical state.
  @Column()
  category: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 12, scale: 2, transformer: decimalTransformer })
  minAmount: number;

  @Column()
  durationDays: number;

  // e.g. 8.5 means 8.5% total return over durationDays.
  @Column('decimal', { precision: 5, scale: 2, transformer: decimalTransformer })
  expectedReturnPercentage: number;

  @Column({ type: 'enum', enum: InvestmentRiskLevel })
  riskLevel: InvestmentRiskLevel;

  @Column({ type: 'enum', enum: InvestmentPlanStatus, default: InvestmentPlanStatus.OPEN })
  status: InvestmentPlanStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}