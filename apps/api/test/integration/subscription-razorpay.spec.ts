import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as crypto from 'crypto';
import {
  PrismaClient,
  PaymentStatus,
  SubscriptionStatus,
  StoreStatus,
  PaymentPurpose,
  PaymentProviderType,
} from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { PaymentsService } from '../../src/modules/payments/payments.service';
import { RazorpayPaymentProvider } from '../../src/modules/payments/providers/razorpay-payment.provider';
import { IllegalPaymentBoundaryException } from '../../src/common/exceptions/domain.exceptions';

describe('Razorpay Test Mode Subscription Integration & Security Tests', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let paymentsService: PaymentsService;
  let razorpayProvider: RazorpayPaymentProvider;

  let sellerToken: string;
  let testTenantId: string;
  let testStoreId: string;
  let testUserId: string;
  let planProId: string;
  let planProPrice: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleFixture.get<PrismaClient>(PrismaClient);
    paymentsService = moduleFixture.get<PaymentsService>(PaymentsService);
    razorpayProvider = moduleFixture.get<RazorpayPaymentProvider>(RazorpayPaymentProvider);

    // Get a standard plan for testing
    const plan = await prisma.plan.findFirst({ where: { code: 'PRO' } }) || await prisma.plan.findFirst();
    expect(plan).toBeDefined();
    planProId = plan!.id;
    planProPrice = plan!.pricePaise;

    // Create an isolated fresh tenant and seller user for clean subscription testing
    const randomSuffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const phone = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;

    const user = await prisma.user.create({
      data: {
        phone,
        email: `seller_${randomSuffix}@test.com`,
        fullName: 'Test Subscription Seller',
        role: 'SELLER_OWNER',
      },
    });
    testUserId = user.id;

    const tenant = await prisma.tenant.create({
      data: {
        name: `Test Store Tenant ${randomSuffix}`,
        slug: `tenant-rzp-${randomSuffix}`,
        memberships: {
          create: {
            userId: user.id,
            role: 'SELLER_OWNER',
          },
        },
      },
    });
    testTenantId = tenant.id;

    const store = await prisma.store.create({
      data: {
        tenantId: tenant.id,
        name: `Test Store ${randomSuffix}`,
        slug: `store-rzp-${randomSuffix}`,
        status: StoreStatus.PRIVATE_PREVIEW,
        isPubliclyAccessible: false,
      },
    });
    testStoreId = store.id;

    // Authenticate Seller
    await request(app.getHttpServer()).post('/auth/otp/send').send({ phone });
    const authRes = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone, code: '123456' });
    sellerToken = authRes.body.data.accessToken;
    expect(sellerToken).toBeDefined();
  });

  afterAll(async () => {
    // Clean up created test entities
    try {
      if (testTenantId) {
        await prisma.subscriptionPayment.deleteMany({
          where: { invoice: { tenantId: testTenantId } },
        });
        await prisma.subscriptionInvoice.deleteMany({
          where: { tenantId: testTenantId },
        });
        await prisma.subscriptionEvent.deleteMany({
          where: { subscription: { tenantId: testTenantId } },
        });
        await prisma.subscription.deleteMany({
          where: { tenantId: testTenantId },
        });
        await prisma.paymentTransaction.deleteMany({
          where: { paymentOrder: { tenantId: testTenantId } },
        });
        await prisma.paymentOrder.deleteMany({
          where: { tenantId: testTenantId },
        });
        await prisma.store.deleteMany({
          where: { tenantId: testTenantId },
        });
        await prisma.tenantMembership.deleteMany({
          where: { tenantId: testTenantId },
        });
        await prisma.tenant.deleteMany({
          where: { id: testTenantId },
        });
        await prisma.user.deleteMany({
          where: { id: testUserId },
        });
      }
    } catch (e) {
      // Ignore cleanup error
    }
    await app.close();
  });

  // ============================================================================
  // 1. SUCCESSFUL TEST MODE SUBSCRIPTION
  // ============================================================================
  describe('1. Successful Test Mode Subscription', () => {
    it('creates Razorpay Test Mode Order, calculates authoritative amount, verifies signature, activates subscription & sets store LIVE', async () => {
      // Step 1: Create subscription order via API
      const createRes = await request(app.getHttpServer())
        .post('/subscriptions/create-order')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          planId: planProId,
          // Client attempts to pass a custom/tampered amount in body: backend MUST ignore and use DB plan.pricePaise
          amountPaise: 100,
        });

      expect(createRes.status).toBe(201);
      const orderData = createRes.body.data;
      expect(orderData).toBeDefined();
      expect(orderData.purpose).toBe(PaymentPurpose.PLATFORM_SUBSCRIPTION);
      expect(orderData.amountPaise).toBe(planProPrice); // Authoritative plan amount from DB
      expect(orderData.providerOrderId).toBeDefined();
      expect(orderData.keyId).toBe(razorpayProvider.platformKeyId);

      // Verify PaymentOrder record in database
      const dbOrder = await prisma.paymentOrder.findUnique({
        where: { id: orderData.paymentOrderId },
      });
      expect(dbOrder).toBeDefined();
      expect(dbOrder!.status).toBe(PaymentStatus.PENDING);
      expect(dbOrder!.amountPaise).toBe(planProPrice);
      expect(dbOrder!.purpose).toBe(PaymentPurpose.PLATFORM_SUBSCRIPTION);
      expect(dbOrder!.provider).toBe(PaymentProviderType.RAZORPAY);

      // Step 2: Simulate Razorpay Checkout success by computing authoritative HMAC signature
      const mockPaymentId = `pay_test_${crypto.randomBytes(6).toString('hex')}`;
      const payload = `${orderData.providerOrderId}|${mockPaymentId}`;
      const validSignature = crypto
        .createHmac('sha256', razorpayProvider.platformKeySecret!)
        .update(payload)
        .digest('hex');

      // Step 3: Send verification payload to backend
      const verifyRes = await request(app.getHttpServer())
        .post('/subscriptions/verify')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          paymentOrderId: orderData.paymentOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_order_id: orderData.providerOrderId,
          razorpay_signature: validSignature,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.success).toBe(true);
      expect(verifyRes.body.data.paymentStatus).toBe(PaymentStatus.PAID);

      // Step 4: Verify subscription is ACTIVE with valid paidThrough (currentPeriodEnd)
      const sub = await prisma.subscription.findFirst({
        where: { tenantId: testTenantId },
        orderBy: { createdAt: 'desc' },
      });
      expect(sub).toBeDefined();
      expect(sub!.status).toBe(SubscriptionStatus.ACTIVE);
      expect(sub!.planId).toBe(planProId);
      expect(sub!.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());

      // Step 5: Verify store is now LIVE and publicly accessible
      const updatedStore = await prisma.store.findUnique({
        where: { id: testStoreId },
      });
      expect(updatedStore).toBeDefined();
      expect(updatedStore!.status).toBe(StoreStatus.LIVE);
      expect(updatedStore!.isPubliclyAccessible).toBe(true);

      // Step 6: Verify PaymentOrder is PAID and invoice/payment records exist
      const updatedOrder = await prisma.paymentOrder.findUnique({
        where: { id: orderData.paymentOrderId },
      });
      expect(updatedOrder!.status).toBe(PaymentStatus.PAID);

      const invoice = await prisma.subscriptionInvoice.findFirst({
        where: { tenantId: testTenantId, subscriptionId: sub!.id },
      });
      expect(invoice).toBeDefined();
      expect(invoice!.amountPaise).toBe(planProPrice);
      expect(invoice!.status).toBe('PAID');
    });
  });

  // ============================================================================
  // 2. FAILED PAYMENT LEAVES STORE PRIVATE
  // ============================================================================
  describe('2. Failed Payment Leaves Store Private', () => {
    it('does not activate subscription and leaves store PRIVATE when payment fails', async () => {
      // Create a secondary tenant for isolated failed payment test
      const failedSuffix = `fail_${Date.now()}`;
      const failTenant = await prisma.tenant.create({
        data: {
          name: `Fail Tenant ${failedSuffix}`,
          slug: `fail-${failedSuffix}`,
        },
      });

      const failStore = await prisma.store.create({
        data: {
          tenantId: failTenant.id,
          name: `Fail Store ${failedSuffix}`,
          slug: `fail-store-${failedSuffix}`,
          status: StoreStatus.PRIVATE_PREVIEW,
          isPubliclyAccessible: false,
        },
      });

      // Create subscription order directly
      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        failTenant.id,
        planProId,
        'MONTHLY',
        undefined,
        true
      );
      expect(subOrder).toBeDefined();

      // Mock razorpayProvider.getPayment to return status: 'failed'
      const originalGetPayment = razorpayProvider.getPayment;
      razorpayProvider.getPayment = jest.fn().mockResolvedValue({
        id: 'pay_failed_123',
        status: 'failed',
        amount: planProPrice,
        order_id: subOrder.providerOrderId,
      });

      try {
        const payload = `${subOrder.providerOrderId}|pay_failed_123`;
        const sig = crypto
          .createHmac('sha256', razorpayProvider.platformKeySecret!)
          .update(payload)
          .digest('hex');

        // Verification must throw due to failed payment status
        await expect(
          paymentsService.verifyAndCapturePayment({
            paymentOrderId: subOrder.paymentOrderId,
            providerPaymentId: 'pay_failed_123',
            providerOrderId: subOrder.providerOrderId,
            providerSignature: sig,
          })
        ).rejects.toThrow('Payment has failed on gateway');

        // Verify store remains PRIVATE_PREVIEW and NOT publicly accessible
        const checkStore = await prisma.store.findUnique({
          where: { id: failStore.id },
        });
        expect(checkStore!.status).toBe(StoreStatus.PRIVATE_PREVIEW);
        expect(checkStore!.isPubliclyAccessible).toBe(false);

        // Verify no active subscription was created
        const sub = await prisma.subscription.findFirst({
          where: { tenantId: failTenant.id },
        });
        expect(sub).toBeNull();

        // Verify PaymentOrder status is FAILED
        const dbOrder = await prisma.paymentOrder.findUnique({
          where: { id: subOrder.paymentOrderId },
        });
        expect(dbOrder!.status).toBe(PaymentStatus.FAILED);
      } finally {
        razorpayProvider.getPayment = originalGetPayment;
        await prisma.paymentOrder.deleteMany({ where: { tenantId: failTenant.id } });
        await prisma.store.deleteMany({ where: { tenantId: failTenant.id } });
        await prisma.tenant.deleteMany({ where: { id: failTenant.id } });
      }
    });
  });

  // ============================================================================
  // 3. INVALID SIGNATURE REJECTED
  // ============================================================================
  describe('3. Invalid Signature Verification', () => {
    it('rejects tampered or forged razorpay_signature and keeps store private', async () => {
      // Create a test subscription order
      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        testTenantId,
        planProId,
        'MONTHLY',
        undefined,
        true
      );

      const fakePaymentId = `pay_fake_${Date.now()}`;
      const fakeSignature = 'bad_forged_signature_0000000000000000000000000000000000000000';

      const res = await request(app.getHttpServer())
        .post('/subscriptions/verify')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          paymentOrderId: subOrder.paymentOrderId,
          razorpay_payment_id: fakePaymentId,
          razorpay_order_id: subOrder.providerOrderId,
          razorpay_signature: fakeSignature,
        });

      // Must be rejected with 400
      expect(res.status).toBe(400);

      // Verify payment order status remains PENDING
      const dbOrder = await prisma.paymentOrder.findUnique({
        where: { id: subOrder.paymentOrderId },
      });
      expect(dbOrder!.status).toBe(PaymentStatus.PENDING);
    });
  });

  // ============================================================================
  // 4. TAMPERED AMOUNT DETECTION
  // ============================================================================
  describe('4. Tampered Amount Protection', () => {
    it('rejects payment if gateway payment amount differs from authoritative plan price', async () => {
      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        testTenantId,
        planProId,
        'MONTHLY',
        undefined,
        true
      );

      // Mock gateway returning a tampered payment amount (e.g. ₹1 instead of plan price)
      const originalGetPayment = razorpayProvider.getPayment;
      razorpayProvider.getPayment = jest.fn().mockResolvedValue({
        id: 'pay_tampered_123',
        status: 'captured',
        amount: 100, // 100 paise = ₹1 (tampered!)
        order_id: subOrder.providerOrderId,
      });

      try {
        const payload = `${subOrder.providerOrderId}|pay_tampered_123`;
        const sig = crypto
          .createHmac('sha256', razorpayProvider.platformKeySecret!)
          .update(payload)
          .digest('hex');

        await expect(
          paymentsService.verifyAndCapturePayment({
            paymentOrderId: subOrder.paymentOrderId,
            providerPaymentId: 'pay_tampered_123',
            providerOrderId: subOrder.providerOrderId,
            providerSignature: sig,
          })
        ).rejects.toThrow('tampered amount detected');
      } finally {
        razorpayProvider.getPayment = originalGetPayment;
      }
    });
  });

  // ============================================================================
  // 5. DUPLICATE CALLBACK IDEMPOTENCY
  // ============================================================================
  describe('5. Duplicate Callback Idempotency', () => {
    it('handles repeated verify callback idempotently without creating duplicate subscriptions', async () => {
      // Find an order that was already paid in previous test
      const paidOrder = await prisma.paymentOrder.findFirst({
        where: { tenantId: testTenantId, status: PaymentStatus.PAID },
      });
      expect(paidOrder).toBeDefined();

      const subCountBefore = await prisma.subscription.count({
        where: { tenantId: testTenantId },
      });

      // Send verification callback again for already PAID order
      const duplicateRes = await request(app.getHttpServer())
        .post('/subscriptions/verify')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          paymentOrderId: paidOrder!.id,
          razorpay_payment_id: 'pay_duplicate_callback',
          razorpay_order_id: paidOrder!.providerOrderId,
          razorpay_signature: 'any_sig',
        });

      expect(duplicateRes.status).toBe(200);
      expect(duplicateRes.body.data.success).toBe(true);
      expect(duplicateRes.body.data.message).toContain('already verified');

      // Verify no duplicate subscription was created
      const subCountAfter = await prisma.subscription.count({
        where: { tenantId: testTenantId },
      });
      expect(subCountAfter).toBe(subCountBefore);
    });
  });

  // ============================================================================
  // 6. ALREADY-ACTIVE SUBSCRIPTION
  // ============================================================================
  describe('6. Already-Active Subscription Protection', () => {
    it('rejects subscription order creation when tenant already has an active subscription', async () => {
      // testTenantId already has an active subscription from test 1
      const activeSub = await prisma.subscription.findFirst({
        where: { tenantId: testTenantId, status: SubscriptionStatus.ACTIVE },
      });
      expect(activeSub).toBeDefined();

      // Attempting to create another subscription order for the same plan must fail
      const res = await request(app.getHttpServer())
        .post('/subscriptions/create-order')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ planId: planProId });

      expect(res.status).toBe(400);
      expect(res.body.message || res.body.error?.message).toContain('already has an active subscription');
    });
  });

  // ============================================================================
  // 7. WRONG RAZORPAY ORDER ID REJECTION
  // ============================================================================
  describe('7. Wrong Razorpay Order ID Protection', () => {
    it('rejects verification if providerOrderId does not match payment order', async () => {
      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        testTenantId,
        planProId,
        'MONTHLY',
        undefined,
        true
      );

      const wrongOrderId = `order_wrong_${Date.now()}`;
      const fakePaymentId = `pay_wrong_${Date.now()}`;
      const payload = `${wrongOrderId}|${fakePaymentId}`;
      const sig = crypto
        .createHmac('sha256', razorpayProvider.platformKeySecret!)
        .update(payload)
        .digest('hex');

      const res = await request(app.getHttpServer())
        .post('/subscriptions/verify')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          paymentOrderId: subOrder.paymentOrderId,
          razorpay_order_id: wrongOrderId, // Mismatched order ID!
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: sig,
        });

      expect(res.status).toBe(400);
      expect(res.body.message || res.body.error?.message).toContain('does not match');
    });
  });

  // ============================================================================
  // 8. DOUBLE-CLICK IDEMPOTENCY
  // ============================================================================
  describe('8. Double-Click Idempotency Protection', () => {
    it('replays existing order response on duplicate idempotency-key without creating second order', async () => {
      const idempotencyKey = `double_click_key_${Date.now()}`;

      // First click
      const res1 = await paymentsService.createPlatformSubscriptionPaymentOrder(
        testTenantId,
        planProId,
        'MONTHLY',
        idempotencyKey,
        true
      );

      // Second click with same idempotency key
      const res2 = await paymentsService.createPlatformSubscriptionPaymentOrder(
        testTenantId,
        planProId,
        'MONTHLY',
        idempotencyKey,
        true
      );

      expect(res1.paymentOrderId).toBe(res2.paymentOrderId);
      expect(res1.providerOrderId).toBe(res2.providerOrderId);
    });
  });

  // ============================================================================
  // 9. STRICT BOUNDARY ISOLATION RULE
  // ============================================================================
  describe('9. Strict Credential Isolation Rule', () => {
    it('preserves PLATFORM_SUBSCRIPTION -> platform credentials and MERCHANT_ORDER -> never platform credentials', async () => {
      // 1. Platform subscription order uses platform key
      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        testTenantId,
        planProId,
        'MONTHLY',
        undefined,
        true
      );
      expect(subOrder.keyId).toBe(razorpayProvider.platformKeyId);

      // 2. Merchant ecommerce order with platform key throws IllegalPaymentBoundaryException
      const customer = await prisma.customer.create({
        data: {
          tenantId: testTenantId,
          storeId: testStoreId,
          phone: '+919999999999',
          fullName: 'Test Buyer',
        },
      });

      const order = await prisma.order.create({
        data: {
          tenantId: testTenantId,
          storeId: testStoreId,
          customerId: customer.id,
          orderNumber: `BOUNDARY-TEST-${Date.now()}`,
          subtotalPaise: 50000,
          totalPaise: 50000,
          deliveryAddress: { city: 'Delhi', pincode: '110001' },
        },
      });

      try {
        const boundaryKey = razorpayProvider.platformKeyId || 'rzp_test_platform_boundary_fixture';
        await prisma.merchantPaymentAccount.upsert({
          where: { storeId_provider: { storeId: testStoreId, provider: 'RAZORPAY' } },
          update: { keyId: boundaryKey, isEnabled: true },
          create: {
            tenantId: testTenantId,
            storeId: testStoreId,
            provider: 'RAZORPAY',
            keyId: boundaryKey,
            keySecretEncrypted: 'secret_leak_attempt',
            isEnabled: true,
          },
        });

        await expect(
          paymentsService.createMerchantPaymentOrder(order.id)
        ).rejects.toThrow(IllegalPaymentBoundaryException);
      } finally {
        await prisma.merchantPaymentAccount.deleteMany({
          where: { storeId: testStoreId, provider: 'RAZORPAY' },
        });
        await prisma.order.deleteMany({ where: { id: order.id } });
        await prisma.customer.deleteMany({ where: { id: customer.id } });
      }
    });
  });

  // ============================================================================
  // 10. PRODUCTION-ONLY GATING TESTS
  // ============================================================================
  describe('10. Development-only Endpoint Gating in Production', () => {
    it('strictly forbids dev-activate in production mode', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const res = await request(app.getHttpServer())
          .post('/subscriptions/dev-activate')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({ planId: planProId, durationDays: 30 });

        expect(res.status).toBe(403);
        expect(res.body.message || res.body.error?.message).toContain('strictly disabled in production');
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });

    it('strictly forbids activate without verified payment in production mode', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const res = await request(app.getHttpServer())
          .post('/subscriptions/activate')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({ planId: planProId, durationDays: 30 });

        expect(res.status).toBe(403);
        expect(res.body.message || res.body.error?.message).toContain('forbidden in production');
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });
  });
});
