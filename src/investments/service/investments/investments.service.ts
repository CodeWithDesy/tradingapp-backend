import { HttpException, HttpStatus, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    InvestmentPlan,
    InvestmentPlanStatus,
    InvestmentRiskLevel,
} from 'src/investments/entities/investment-plan.entity';
import { UserInvestment, UserInvestmentStatus } from 'src/investments/entities/user-investment.entity';
import { BankingService } from 'src/banking/service/banking/banking.service';
import { CreateInvestmentParams, CreateInvestmentPlanParams, UpdateInvestmentPlanParams } from 'utils/types';
import { User } from 'src/users/entities/user.entity/user.entity';

@Injectable()
export class InvestmentsService implements OnApplicationBootstrap {

    constructor(
        @InjectRepository(InvestmentPlan) private planRepository: Repository<InvestmentPlan>,
        @InjectRepository(UserInvestment) private investmentRepository: Repository<UserInvestment>,
        private bankingService: BankingService,
    ) {}

    async onApplicationBootstrap() {
        const count = await this.planRepository.count();
        if (count > 0) return;

        await this.planRepository.save([
            this.planRepository.create({
                name: 'Stable Income Fund', category: 'Bonds',
                description: 'Low-risk fund focused on government and corporate bonds.',
                minAmount: 100, durationDays: 30, expectedReturnPercentage: 3.5,
                riskLevel: InvestmentRiskLevel.LOW, status: InvestmentPlanStatus.OPEN,
            }),
            this.planRepository.create({
                name: 'Growth Equity Portfolio', category: 'Stocks',
                description: 'Diversified basket of growth-stage equities.',
                minAmount: 500, durationDays: 90, expectedReturnPercentage: 8.5,
                riskLevel: InvestmentRiskLevel.MEDIUM, status: InvestmentPlanStatus.OPEN,
            }),
            this.planRepository.create({
                name: 'Real Estate Trust', category: 'Real Estate',
                description: 'Pooled investment in commercial real estate holdings.',
                minAmount: 1000, durationDays: 180, expectedReturnPercentage: 12,
                riskLevel: InvestmentRiskLevel.MEDIUM, status: InvestmentPlanStatus.OPEN,
            }),
            this.planRepository.create({
                name: 'Crypto Momentum Fund', category: 'Crypto',
                description: 'Actively managed exposure to major cryptocurrencies.',
                minAmount: 200, durationDays: 60, expectedReturnPercentage: 18,
                riskLevel: InvestmentRiskLevel.HIGH, status: InvestmentPlanStatus.OPEN,
            }),
            this.planRepository.create({
                name: 'Legacy Bond Series', category: 'Bonds',
                description: 'A closed, previous-series bond fund — no longer accepting new investment.',
                minAmount: 50, durationDays: 365, expectedReturnPercentage: 6,
                riskLevel: InvestmentRiskLevel.LOW, status: InvestmentPlanStatus.CLOSED,
            }),
        ]);
    }

    getPlans() {
        return this.planRepository.find();
    }

    async getPlanById(id: number) {
        const plan = await this.planRepository.findOneBy({ id });
        if (!plan) {
            throw new HttpException('Investment plan not found.', HttpStatus.NOT_FOUND);
        }
        return plan;
    }

    async createInvestment(userId: number, params: CreateInvestmentParams) {
        const plan = await this.getPlanById(params.planId);

        if (plan.status !== InvestmentPlanStatus.OPEN) {
            throw new HttpException('This investment plan is not currently open.', HttpStatus.BAD_REQUEST);
        }
        if (params.amount < Number(plan.minAmount)) {
            throw new HttpException(
                `Minimum investment for this plan is ${plan.minAmount}.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        await this.bankingService.debitWallet(userId, params.amount);

        const maturityDate = new Date();
        maturityDate.setDate(maturityDate.getDate() + plan.durationDays);

        const expectedPayoutAmount = Number(
            (params.amount * (1 + Number(plan.expectedReturnPercentage) / 100)).toFixed(2),
        );

        const investment = this.investmentRepository.create({
            amount: params.amount,
            expectedPayoutAmount,
            maturityDate,
            status: UserInvestmentStatus.ACTIVE,
            user: { id: userId } as User,
            plan,
        });
        return this.investmentRepository.save(investment);
    }

    getUserInvestments(userId: number) {
        return this.investmentRepository.find({
            where: { user: { id: userId } },
            relations: { plan: true },
            order: { createdAt: 'DESC' },
        });
    }

    async getUserInvestmentById(userId: number, investmentId: number) {
        const investment = await this.investmentRepository.findOne({
            where: { id: investmentId, user: { id: userId } },
            relations: { plan: true },
        });
        if (!investment) {
            throw new HttpException('Investment not found.', HttpStatus.NOT_FOUND);
        }
        return investment;
    }

    async getPortfolioSummary(userId: number) {
        const investments = await this.investmentRepository.find({ where: { user: { id: userId } } });
        const active = investments.filter((i) => i.status === UserInvestmentStatus.ACTIVE);
        const completed = investments.filter((i) => i.status === UserInvestmentStatus.COMPLETED);

        return {
            totalInvested: investments.reduce((sum, i) => sum + Number(i.amount), 0),
            activeCount: active.length,
            completedCount: completed.length,
            totalExpectedPayout: active.reduce((sum, i) => sum + Number(i.expectedPayoutAmount), 0),
        };
    }

    createPlan(params: CreateInvestmentPlanParams) {
        const plan = this.planRepository.create(params);
        return this.planRepository.save(plan);
    }

    async updatePlan(id: number, params: UpdateInvestmentPlanParams) {
        const plan = await this.getPlanById(id);
        Object.assign(plan, params);
        return this.planRepository.save(plan);
    }

    async getAllInvestments() {
        const investments = await this.investmentRepository.find({
            relations: { user: true, plan: true },
            order: { createdAt: 'DESC' },
        });
        return investments.map((investment) => {
            const { password, ...safeUser } = investment.user;
            return { ...investment, user: safeUser };
        });
    }
}