import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from 'src/banking/entities/wallet.entity';
import { Deposit } from 'src/banking/entities/deposit.entity';
import { Withdrawal } from 'src/banking/entities/withdrawal.entity';
import { CryptoDepositAddress } from 'src/banking/entities/crypto-deposit-address.entity';
import { BankingService } from 'src/banking/service/banking/banking.service';
import { BankingController } from 'src/banking/controller/banking/banking.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Deposit, Withdrawal, CryptoDepositAddress]), NotificationsModule],
  controllers: [BankingController],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}