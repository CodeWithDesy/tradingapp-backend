import { IsIn } from 'class-validator';
import { WithdrawalStatus } from 'src/banking/entities/withdrawal.entity';

export class UpdateWithdrawalStatusDto {
    @IsIn([WithdrawalStatus.COMPLETED, WithdrawalStatus.FAILED])
    status: WithdrawalStatus;
}