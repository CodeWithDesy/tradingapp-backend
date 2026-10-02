import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from 'src/admin/entities/audit-log.entity';
import { AdminService } from 'src/admin/service/admin/admin.service';
import { AdminController } from 'src/admin/controller/admin/admin.controller';
import { UsersModule } from 'src/users/users.module';
import { BankingModule } from 'src/banking/banking.module';
import { InvestmentsModule } from 'src/investments/investments.module';
import { TradingModule } from 'src/trading/trading.module';
import { SupportModule } from 'src/support/support.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    UsersModule,
    BankingModule,
    InvestmentsModule,
    TradingModule,
    SupportModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}