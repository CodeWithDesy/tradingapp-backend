import { IsEnum } from 'class-validator';
import { AccountStatus } from 'src/users/entities/user.entity/user.entity';


export class UpdateUserStatusDto {
    @IsEnum(AccountStatus)
    status: AccountStatus;
}