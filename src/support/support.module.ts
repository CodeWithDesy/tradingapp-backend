import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportMessage } from 'src/support/entities/support-message.entity';
import { SupportService } from 'src/support/service/support/support.service';
import { SupportController } from 'src/support/controller/support/support.controller';
import { GuestSupportController } from 'src/support/controller/guest-support/guest-support.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([SupportMessage]), NotificationsModule],
  controllers: [SupportController, GuestSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}