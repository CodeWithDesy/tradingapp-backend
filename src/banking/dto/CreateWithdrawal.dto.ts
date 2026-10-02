import { IsEnum, IsNumber, IsString, IsNotEmpty, ValidateIf, Min } from 'class-validator';
import { WithdrawalMethod } from 'src/banking/entities/withdrawal.entity';

export class CreateWithdrawalDto {
    @IsNumber()
    @Min(1)
    amount: number;

    @IsEnum(WithdrawalMethod)
    method: WithdrawalMethod;

    // Required when method is BANK_TRANSFER, ignored otherwise.
    @ValidateIf((dto) => dto.method === WithdrawalMethod.BANK_TRANSFER)
    @IsString()
    @IsNotEmpty()
    bankAccountName: string;

    @ValidateIf((dto) => dto.method === WithdrawalMethod.BANK_TRANSFER)
    @IsString()
    @IsNotEmpty()
    bankAccountNumber: string;

    @ValidateIf((dto) => dto.method === WithdrawalMethod.BANK_TRANSFER)
    @IsString()
    @IsNotEmpty()
    bankName: string;

    @ValidateIf((dto) => dto.method === WithdrawalMethod.BANK_TRANSFER)
    @IsString()
    @IsNotEmpty()
    bankRoutingNumber: string;

    // Required when method is CRYPTO, ignored otherwise.
    @ValidateIf((dto) => dto.method === WithdrawalMethod.CRYPTO)
    @IsString()
    @IsNotEmpty()
    cryptoAddress: string;
}