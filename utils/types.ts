import { DepositMethod } from 'src/banking/entities/deposit.entity';
import { WithdrawalMethod } from 'src/banking/entities/withdrawal.entity';
import { TradeSide } from 'src/trading/entities/trade.entity';
import { InvestmentRiskLevel, InvestmentPlanStatus } from 'src/investments/entities/investment-plan.entity';

export type CreateUserParams = {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    password: string;
};

export type UpdateUserParams = {
    fullName?: string;
    phone?: string;
    country?: string;
    avatar?: string;
};

export type CreateDepositParams = {
    amount: number;
    method: DepositMethod;
};

export type CreateWithdrawalParams = {
    amount: number;
    method: WithdrawalMethod;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankName?: string;
    bankRoutingNumber?: string;
    cryptoAddress?: string;
};

export type QueryTransactionsParams = {
    page?: number;
    limit?: number;
    type?: 'DEPOSIT' | 'WITHDRAWAL';
    search?: string;
    startDate?: string;
    endDate?: string;
};

export type CreateInvestmentParams = {
    planId: number;
    amount: number;
};

export type CreateInvestmentPlanParams = {
    name: string;
    category: string;
    description: string;
    minAmount: number;
    durationDays: number;
    expectedReturnPercentage: number;
    riskLevel: InvestmentRiskLevel;
    status?: InvestmentPlanStatus;
};

export type UpdateInvestmentPlanParams = {
    name?: string;
    category?: string;
    description?: string;
    minAmount?: number;
    durationDays?: number;
    expectedReturnPercentage?: number;
    riskLevel?: InvestmentRiskLevel;
    status?: InvestmentPlanStatus;
};

export type CreateTradeParams = {
    marketId: number;
    side: TradeSide;
    quantity: number;
};