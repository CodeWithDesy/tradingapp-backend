import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateInvestmentDto {
    @IsInt()
    planId: number;

    @IsNumber()
    @Min(1)
    amount: number;
}