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
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'desymilano99',
      database: 'prolific_database',
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}