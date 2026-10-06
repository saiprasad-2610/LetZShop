import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { DashboardService } from './dashboard.service';
import { StoresModule } from '../stores/stores.module';
import { CatalogModule } from '../catalog/catalog.module';
import { ThemesModule } from '../themes/themes.module';
import { OrdersModule } from '../orders/orders.module';
import { MediaModule } from '../media/media.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    StoresModule,
    CatalogModule,
    ThemesModule,
    OrdersModule,
    MediaModule,
  ],
  controllers: [SellerController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class SellerModule {}
