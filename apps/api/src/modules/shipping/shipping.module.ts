import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { MockShippingProvider } from './providers/mock-shipping.provider';
import { ShiprocketShippingProvider } from './providers/shiprocket-shipping.provider';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ShippingController],
  providers: [ShippingService, MockShippingProvider, ShiprocketShippingProvider],
  exports: [ShippingService, MockShippingProvider, ShiprocketShippingProvider],
})
export class ShippingModule {}
