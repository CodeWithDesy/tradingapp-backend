import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users/users.controller';
import { UsersService } from './service/users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity/user.entity';
import { ProfileController } from './controller/profile/profile/profile.controller';
import { BankingModule } from 'src/banking/banking.module';


@Module({
  imports: [TypeOrmModule.forFeature([User]), BankingModule],
  controllers: [UsersController, ProfileController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
