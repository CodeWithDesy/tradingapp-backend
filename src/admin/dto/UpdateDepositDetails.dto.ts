import { IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { DepositMethod } from 'src/banking/entities/deposit.entity';

export class UpdateDepositDetailsDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    amount?: number;

    @IsOptional()
    @IsEnum(DepositMethod)
    method?: DepositMethod;
}