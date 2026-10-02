import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InvestmentPlanStatus, InvestmentRiskLevel } from 'src/investments/entities/investment-plan.entity';

export class CreateInvestmentPlanDto {
    @IsString() @IsNotEmpty() name: string;
    @IsString() @IsNotEmpty() category: string;
    @IsString() @IsNotEmpty() description: string;
    @IsNumber() @Min(1) minAmount: number;
    @IsInt() @Min(1) durationDays: number;
    @IsNumber() @Min(0) expectedReturnPercentage: number;
    @IsEnum(InvestmentRiskLevel) riskLevel: InvestmentRiskLevel;
    @IsOptional() @IsEnum(InvestmentPlanStatus) status?: InvestmentPlanStatus;
}