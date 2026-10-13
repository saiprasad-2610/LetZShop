import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ShippingModule } from '../shipping/shipping.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ShippingModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
