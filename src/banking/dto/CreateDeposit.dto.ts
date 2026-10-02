import { IsEnum, IsNumber, Min } from 'class-validator';
import { DepositMethod } from 'src/banking/entities/deposit.entity';

export class CreateDepositDto {
    @IsNumber()
    @Min(1)
    amount: number;

    @IsEnum(DepositMethod)
    method: DepositMethod;
}