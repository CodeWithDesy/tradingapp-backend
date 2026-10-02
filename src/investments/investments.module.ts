import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestmentPlan } from 'src/investments/entities/investment-plan.entity';
import { UserInvestment } from 'src/investments/entities/user-investment.entity';
import { InvestmentsService } from 'src/investments/service/investments/investments.service';
import { InvestmentsController } from 'src/investments/controller/investments/investments.controller';
import { BankingModule } from 'src/banking/banking.module';

@Module({
  imports: [TypeOrmModule.forFeature([InvestmentPlan, UserInvestment]), BankingModule],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}