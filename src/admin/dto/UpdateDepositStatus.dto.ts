import { IsIn } from 'class-validator';
import { DepositStatus } from 'src/banking/entities/deposit.entity';

export class UpdateDepositStatusDto {
    // Deliberately excludes PENDING — an admin resolves a pending deposit,
    // never sets one back to pending.
    @IsIn([DepositStatus.COMPLETED, DepositStatus.FAILED])
    status: DepositStatus;
}