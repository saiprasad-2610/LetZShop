import { PaymentPurpose } from '@prisma/client';

export interface CreatePaymentOrderInput {
  tenantId: string;
  storeId: string;
  orderId?: string;
  orderNumber?: string;
  subscriptionId?: string;
  amountPaise: number;
  currency: string;
  purpose?: PaymentPurpose;
  merchantKeyId?: string;
  merchantKeySecret?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  providerOrderId: string;
  amountPaise: number;
  currency: string;
  status: string;
  keyId?: string;
}

export interface VerifyPaymentInput {
  orderId?: string;
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
  merchantSecret?: string;
}

export interface RefundInput {
  paymentTransactionId: string;
  providerPaymentId: string;
  amountPaise: number;
  reason?: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: string;
  amountPaise: number;
}

export interface PaymentProvider {
  createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<boolean>;
  capturePayment(paymentId: string, amountPaise: number, credentials?: { keyId?: string; keySecret?: string }): Promise<boolean>;
  refundPayment(input: RefundInput, credentials?: { keyId?: string; keySecret?: string }): Promise<RefundResult>;
  handleWebhook(payload: any, signature: string, secret?: string): Promise<{ eventType: string; eventId: string; isValid: boolean; data: any; rawEvent?: any }>;
}

