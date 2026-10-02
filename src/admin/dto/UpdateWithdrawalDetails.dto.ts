import { IsOptional, IsNumber, Min, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { WithdrawalMethod } from 'src/banking/entities/withdrawal.entity';

export class UpdateWithdrawalDetailsDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    amount?: number;

    @IsOptional()
    @IsEnum(WithdrawalMethod)
    method?: WithdrawalMethod;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    bankAccountName?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    bankAccountNumber?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    bankName?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    bankRoutingNumber?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    cryptoAddress?: string;
}