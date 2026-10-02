import { RazorpayPaymentProvider } from '../../src/modules/payments/providers/razorpay-payment.provider';
import * as crypto from 'crypto';

describe('Payment Verification & Gateways (Unit Tests)', () => {
  let razorpayProvider: RazorpayPaymentProvider;

  beforeEach(() => {
    razorpayProvider = new RazorpayPaymentProvider();
  });

  it('1. Correctly verifies authentic Razorpay HMAC-SHA256 signature', async () => {
    const merchantSecret = 'secret_key_store_aurelia_999';
    const orderId = 'order_998877';
    const paymentId = 'pay_11223344';

    // Signature formula: hmac_sha256(order_id + "|" + payment_id, secret)
    const validSignature = crypto
      .createHmac('sha256', merchantSecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = await razorpayProvider.verifyPayment({
      orderId: 'internal-order-1',
      providerOrderId: orderId,
      providerPaymentId: paymentId,
      providerSignature: validSignature,
      merchantSecret,
    });

    expect(isValid).toBe(true);
  });

  it('2. Rejects forged or tampered payment signature', async () => {
    const merchantSecret = 'secret_key_store_aurelia_999';
    const orderId = 'order_998877';
    const paymentId = 'pay_11223344';

    const forgedSignature = 'forged_fake_signature_attempt_12345';

    const isValid = await razorpayProvider.verifyPayment({
      orderId: 'internal-order-1',
      providerOrderId: orderId,
      providerPaymentId: paymentId,
      providerSignature: forgedSignature,
      merchantSecret,
    });

    expect(isValid).toBe(false);
  });

  it('3. Rejects payment verification when secret is mismatched', async () => {
    const wrongSecret = 'different_store_secret';
    const orderId = 'order_998877';
    const paymentId = 'pay_11223344';

    const signatureWithCorrectSecret = crypto
      .createHmac('sha256', 'actual_store_secret')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = await razorpayProvider.verifyPayment({
      orderId: 'internal-order-1',
      providerOrderId: orderId,
      providerPaymentId: paymentId,
      providerSignature: signatureWithCorrectSecret,
      merchantSecret: wrongSecret,
    });

    expect(isValid).toBe(false);
  });
});
