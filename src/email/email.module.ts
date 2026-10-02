import { Module } from '@nestjs/common';
import { EmailService } from 'src/email/service/email/email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}