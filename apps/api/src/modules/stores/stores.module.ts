import { Module, forwardRef } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { StorefrontController } from './storefront.controller';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [AuthModule, CartModule, OrdersModule],
  controllers: [StoresController, StorefrontController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}

