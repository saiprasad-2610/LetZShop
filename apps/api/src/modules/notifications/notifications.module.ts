import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { WhatsAppService } from './whatsapp.service';

@Module({
  providers: [MailService, WhatsAppService],
  exports: [MailService, WhatsAppService],
})
export class NotificationsModule {}
