import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Market } from 'src/trading/entities/market.entity';
import { Trade } from 'src/trading/entities/trade.entity';
import { Position } from 'src/trading/entities/position.entity';
import { TradingService } from 'src/trading/service/trading/trading.service';
import { TradingController } from 'src/trading/controller/trading/trading.controller';
import { BankingModule } from 'src/banking/banking.module';

@Module({
  imports: [TypeOrmModule.forFeature([Market, Trade, Position]), BankingModule],
  controllers: [TradingController],
  providers: [TradingService],
  exports: [TradingService],
})
export class TradingModule {}