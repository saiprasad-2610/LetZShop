import { Global, Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionVisibilityService } from './subscription-visibility.service';
import { SubscriptionController } from './subscription.controller';

@Global()
@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionVisibilityService],
  exports: [SubscriptionService, SubscriptionVisibilityService],
})
export class SubscriptionModule {}
