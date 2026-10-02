import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InvestmentPlanStatus, InvestmentRiskLevel } from 'src/investments/entities/investment-plan.entity';

export class UpdateInvestmentPlanDto {
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() category?: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsNumber() @Min(1) minAmount?: number;
    @IsOptional() @IsInt() @Min(1) durationDays?: number;
    @IsOptional() @IsNumber() @Min(0) expectedReturnPercentage?: number;
    @IsOptional() @IsEnum(InvestmentRiskLevel) riskLevel?: InvestmentRiskLevel;
    @IsOptional() @IsEnum(InvestmentPlanStatus) status?: InvestmentPlanStatus;
}