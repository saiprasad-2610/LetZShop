import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  CreatePaymentOrderInput,
  PaymentOrderResult,
  VerifyPaymentInput,
  RefundInput,
  RefundResult,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(MockPaymentProvider.name);

  public async createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult> {
    const providerOrderId = `mock_order_${input.orderNumber}_${Date.now()}`;
    this.logger.log(`[MOCK PAYMENT] Created order: ${providerOrderId} for amount: ₹${input.amountPaise / 100}`);

    return {
      providerOrderId,
      amountPaise: input.amountPaise,
      currency: input.currency,
      status: 'created',
      keyId: 'mock_key_id_dev',
    };
  }

  public async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    // Fail verification if signature explicitly marked invalid (for automated failure tests)
    if (input.providerSignature === 'invalid_signature') {
      this.logger.warn(`[MOCK PAYMENT] Payment verification failed: invalid signature received.`);
      return false;
    }
    this.logger.log(`[MOCK PAYMENT] Payment verified successfully: ${input.providerPaymentId}`);
    return true;
  }

  public async capturePayment(paymentId: string, amountPaise: number): Promise<boolean> {
    this.logger.log(`[MOCK PAYMENT] Payment captured: ${paymentId} for ₹${amountPaise / 100}`);
    return true;
  }

  public async refundPayment(input: RefundInput): Promise<RefundResult> {
    const providerRefundId = `mock_rfnd_${Date.now()}`;
    this.logger.log(`[MOCK PAYMENT] Refund processed: ${providerRefundId} for ₹${input.amountPaise / 100}`);
    return {
      providerRefundId,
      status: 'processed',
      amountPaise: input.amountPaise,
    };
  }

  public async handleWebhook(payload: any, signature: string, secret?: string) {
    return {
      eventType: payload.event || 'payment.captured',
      eventId: payload.id || `mock_evt_${Date.now()}`,
      isValid: signature !== 'invalid_signature',
      data: payload.payload || payload,
    };
  }
}
