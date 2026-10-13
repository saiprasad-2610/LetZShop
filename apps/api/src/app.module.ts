import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubscriptionModule } from './modules/subscriptions/subscription.module';
import { StoresModule } from './modules/stores/stores.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { MediaModule } from './modules/media/media.module';
import { EnquiriesModule } from './modules/enquiries/enquiries.module';
import { ThemesModule } from './modules/themes/themes.module';
import { AuditModule } from './modules/audit/audit.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { HealthModule } from './modules/health/health.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AdminModule } from './modules/admin/admin.module';
import { SellerModule } from './modules/seller/seller.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL_MS', 60000),
          limit: config.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    SubscriptionModule,
    StoresModule,
    CatalogModule,
    InventoryModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    MediaModule,
    EnquiriesModule,
    ThemesModule,
    AuditModule,
    PrivacyModule,
    OutboxModule,
    HealthModule,
    CustomersModule,
    AdminModule,
    SellerModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
