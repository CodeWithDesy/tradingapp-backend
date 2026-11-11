import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { InvestmentsModule } from './investments/investments.module';
import { TradingModule } from './trading/trading.module';
import { AuthModule } from './auth/auth.module';
import { BankingModule } from './banking/banking.module';
import { AdminModule } from './admin/admin.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { SupportModule } from './support/support.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    BankingModule,
    InvestmentsModule,
    TradingModule,
    AdminModule,
    NotificationsModule,
    EmailModule,
    SupportModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  autoLoadEntities: true,
  synchronize: true,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
}),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}