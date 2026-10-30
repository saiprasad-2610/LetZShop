import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { QrCodeService } from './qr-code.service';
import { QrCodeController } from './qr-code.controller';

@Module({
  imports: [PrismaModule],
  controllers: [QrCodeController],
  providers: [QrCodeService],
  exports: [QrCodeService],
})
export class QrCodeModule {}
