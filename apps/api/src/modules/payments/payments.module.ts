import { Global, Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { RazorpayPaymentProvider } from './providers/razorpay-payment.provider';

@Global()
@Module({
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, MockPaymentProvider, RazorpayPaymentProvider],
  exports: [PaymentsService, MockPaymentProvider, RazorpayPaymentProvider],
})
export class PaymentsModule {}

