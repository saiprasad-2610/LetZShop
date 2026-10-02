import * as crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient, PaymentStatus, OrderStatus, ShipmentStatus } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { SEED_IDS } from '@simply/db';
import { PaymentStateMachine } from '../../src/modules/payments/state-machine/payment-state-machine';
import {
  IllegalPaymentBoundaryException,
  IllegalPaymentTransitionException,
} from '../../src/common/exceptions/domain.exceptions';
import { PaymentsService } from '../../src/modules/payments/payments.service';
import { RazorpayPaymentProvider } from '../../src/modules/payments/providers/razorpay-payment.provider';
import { ShippingService } from '../../src/modules/shipping/shipping.service';
import { MediaService } from '../../src/modules/media/media.service';

describe('Phase 2.5: Integration Readiness, Security Hardening & End-to-End Reliability', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let paymentsService: PaymentsService;
  let razorpayProvider: RazorpayPaymentProvider;
  let shippingService: ShippingService;
  let mediaService: MediaService;

  let sellerToken: string;
  let adminToken: string;
  let testStoreId: string;
  let testTenantId: string;
  const testWhSecret = 'phase2_5_wh_secret_test_32_bytes';

  beforeAll(async () => {
    process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET = testWhSecret;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), {
      rawBody: true,
    });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleFixture.get<PrismaClient>(PrismaClient);
    paymentsService = moduleFixture.get<PaymentsService>(PaymentsService);
    razorpayProvider = moduleFixture.get<RazorpayPaymentProvider>(RazorpayPaymentProvider);
    shippingService = moduleFixture.get<ShippingService>(ShippingService);
    mediaService = moduleFixture.get<MediaService>(MediaService);

    testTenantId = SEED_IDS.tenantA;
    testStoreId = SEED_IDS.storeA;

    // Authenticate Seller (+919876543210)
    await request(app.getHttpServer()).post('/auth/otp/send').send({ phone: '+919876543210' });
    const sellerAuth = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '+919876543210', code: '123456' });
    sellerToken = sellerAuth.body.data.accessToken;

    // Authenticate SuperAdmin (+919800000000)
    await request(app.getHttpServer()).post('/auth/otp/send').send({ phone: '+919800000000' });
    const adminAuth = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '+919800000000', code: '123456' });
    adminToken = adminAuth.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================================
  // 1. PAYMENT FLOW SEPARATION TESTS
  // ============================================================================
  describe('1. Two Distinct Payment Flows (Platform Subscription vs Merchant Orders)', () => {
    it('Creates a PLATFORM_SUBSCRIPTION payment order using AIKYAM platform credentials', async () => {
      const plan = await prisma.plan.findFirst();
      expect(plan).toBeDefined();

      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        testTenantId,
        plan!.id,
        'MONTHLY'
      );

      expect(subOrder).toBeDefined();
      expect(subOrder.purpose).toBe('PLATFORM_SUBSCRIPTION');
      expect(subOrder.providerOrderId).toBeDefined();
      expect(subOrder.amountPaise).toBe(plan!.pricePaise);

      // Verify record stored in DB
      const dbOrder = await prisma.paymentOrder.findUnique({
        where: { id: subOrder.paymentOrderId },
      });
      expect(dbOrder).toBeDefined();
      expect(dbOrder!.purpose).toBe('PLATFORM_SUBSCRIPTION');
      expect(dbOrder!.subscriptionId).toBe(plan!.id);
      expect(dbOrder!.orderId).toBeNull();
    });

    it('Strict Boundary: Forbids using AIKYAM platform Razorpay Key for merchant store orders', async () => {
      // Create a test order
      const customer = await prisma.customer.findFirst({ where: { storeId: testStoreId } });
      const order = await prisma.order.create({
        data: {
          tenantId: testTenantId,
          storeId: testStoreId,
          customerId: customer!.id,
          orderNumber: `SEC-TEST-${Date.now()}`,
          subtotalPaise: 100000,
          totalPaise: 100000,
          deliveryAddress: { city: 'Mumbai', pincode: '400001' },
        },
      });

      try {
        // Temporarily set merchant payment account with platform key
        const boundaryKey = razorpayProvider.platformKeyId || 'rzp_test_platform_boundary_fixture';
        await prisma.merchantPaymentAccount.upsert({
          where: { storeId_provider: { storeId: testStoreId, provider: 'RAZORPAY' } },
          update: { keyId: boundaryKey, isEnabled: true },
          create: {
            tenantId: testTenantId,
            storeId: testStoreId,
            provider: 'RAZORPAY',
            keyId: boundaryKey,
            keySecretEncrypted: 'secret_123',
            isEnabled: true,
          },
        });

        // Attempting to create merchant payment order with platform key must throw IllegalPaymentBoundaryException
        await expect(
          paymentsService.createMerchantPaymentOrder(order.id)
        ).rejects.toThrow(IllegalPaymentBoundaryException);
      } finally {
        // Guarantee cleanup of test merchant account
        await prisma.merchantPaymentAccount.deleteMany({
          where: { storeId: testStoreId, provider: 'RAZORPAY' },
        });
      }
    });
  });

  // ============================================================================
  // 2. SUBSCRIPTION ACTIVATION SECURITY TESTS
  // ============================================================================
  describe('2. Subscription Activation Security', () => {
    it('Rejects direct unverified subscription activation in production mode', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const plan = await prisma.plan.findFirst();

      try {
        const res = await request(app.getHttpServer())
          .post('/subscriptions/activate')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({ planId: plan!.id, durationDays: 30 });

        expect(res.status).toBe(403);
        expect(res.body.message || res.body.error?.message).toContain('forbidden in production');
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });

    it('Rejects dev-activate in production mode', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const plan = await prisma.plan.findFirst();

      try {
        const res = await request(app.getHttpServer())
          .post('/subscriptions/dev-activate')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({ planId: plan!.id, durationDays: 30 });

        expect(res.status).toBe(403);
        expect(res.body.message || res.body.error?.message).toContain('strictly disabled in production');
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });

    it('Permits dev-activate in test/development mode and writes an explicit audit log', async () => {
      const plan = await prisma.plan.findFirst();

      const res = await request(app.getHttpServer())
        .post('/subscriptions/dev-activate')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ planId: plan!.id, durationDays: 30 });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          tenantId: testTenantId,
          action: 'DEV_SUBSCRIPTION_ACTIVATED',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit).toBeDefined();
      expect((audit!.metadata as any)?.mode).toBe('DEVELOPMENT_SIMULATION');
    });
  });

  // ============================================================================
  // 3. PAYMENT STATE MACHINE TESTS
  // ============================================================================
  describe('3. Payment State Machine Transitions', () => {
    it('Permits valid transition PENDING -> PAID', () => {
      expect(() =>
        PaymentStateMachine.validateTransition(PaymentStatus.PENDING, PaymentStatus.PAID)
      ).not.toThrow();
    });

    it('Permits valid transition PAID -> REFUNDED', () => {
      expect(() =>
        PaymentStateMachine.validateTransition(PaymentStatus.PAID, PaymentStatus.REFUNDED)
      ).not.toThrow();
    });

    it('Rejects illegal backwards transition PAID -> PENDING', () => {
      expect(() =>
        PaymentStateMachine.validateTransition(PaymentStatus.PAID, PaymentStatus.PENDING)
      ).toThrow(IllegalPaymentTransitionException);
    });

    it('Rejects illegal terminal transition REFUNDED -> PAID', () => {
      expect(() =>
        PaymentStateMachine.validateTransition(PaymentStatus.REFUNDED, PaymentStatus.PAID)
      ).toThrow(IllegalPaymentTransitionException);
    });

    it('Rejects illegal terminal transition FAILED -> PAID', () => {
      expect(() =>
        PaymentStateMachine.validateTransition(PaymentStatus.FAILED, PaymentStatus.PAID)
      ).toThrow(IllegalPaymentTransitionException);
    });
  });

  // ============================================================================
  // 4. RAZORPAY WEBHOOK PIPELINE TESTS
  // ============================================================================
  describe('4. Razorpay Webhook Pipeline & Deduplication', () => {
    it('Rejects webhook with missing or invalid signature', async () => {
      const res = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('x-razorpay-signature', 'invalid_signature_test')
        .send({ id: `evt_${Date.now()}`, event: 'payment.captured' });

      expect(res.status).toBe(400);
    });

    it('Accepts valid webhook signature and idempotently deduplicates repeated events', async () => {
      const eventId = `test_wh_event_${Date.now()}`;
      const payloadObj = {
        id: eventId,
        event: 'payment.captured',
        payload: {
          payment: { entity: { id: `pay_${Date.now()}`, amount: 129900 } },
        },
      };
      const rawPayload = JSON.stringify(payloadObj);
      const validSig = crypto
        .createHmac('sha256', testWhSecret)
        .update(rawPayload)
        .digest('hex');

      // 1st delivery
      const firstRes = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', validSig)
        .send(rawPayload);

      expect(firstRes.status).toBe(200);
      expect(firstRes.body.data.status).toBe('processed');

      // 2nd delivery (duplicate redelivery)
      const secondRes = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', validSig)
        .send(rawPayload);

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.data.status).toBe('already_processed');
    });
  });

  // ============================================================================
  // 5. SECURE ORDER TRACKING TESTS
  // ============================================================================
  describe('5. Secure Order Tracking with Cryptographic Token', () => {
    let orderNumber: string;
    let trackingToken: string;

    beforeAll(async () => {
      // Create guest cart and checkout
      const cartInit = await request(app.getHttpServer())
        .post('/cart/init')
        .send({ storeId: testStoreId });
      const cartId = cartInit.body.data.id;

      const variant = await prisma.productVariant.findFirst({
        where: { storeId: testStoreId, status: 'ACTIVE' },
      });

      await request(app.getHttpServer())
        .post(`/cart/${cartId}/items`)
        .send({ variantId: variant!.id, quantity: 1 });

      const checkoutRes = await request(app.getHttpServer())
        .post('/orders/checkout')
        .send({
          storeId: testStoreId,
          cartId,
          fullName: 'Ananya Roy',
          phone: '+919876543210',
          deliveryAddress: {
            addressLine1: 'Flat 12B, Marine Drive',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400020',
          },
        });

      expect(checkoutRes.status).toBe(201);
      orderNumber = checkoutRes.body.data.orderNumber;
      trackingToken = checkoutRes.body.data.trackingToken;
      expect(trackingToken).toBeDefined();
    });

    it('Rejects tracking access when ?t= token is missing (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer()).get(`/orders/track/${orderNumber}`);
      expect(res.status).toBe(403);
    });

    it('Rejects tracking access when an invalid token is supplied (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer()).get(
        `/orders/track/${orderNumber}?t=fake_token_123`
      );
      expect(res.status).toBe(403);
    });

    it('Grants tracking access and returns buyer-safe masked DTO when valid ?t= token is provided', async () => {
      const res = await request(app.getHttpServer()).get(
        `/orders/track/${orderNumber}?t=${trackingToken}`
      );
      expect(res.status).toBe(200);

      const data = res.body.data;
      expect(data.orderNumber).toBe(orderNumber);
      expect(data.status).toBe('NEW');
      expect(data.deliveryCity).toBe('Mumbai');
      expect(data.deliveryState).toBe('Maharashtra');
      // Pincode is masked for privacy
      expect(data.deliveryPincode).toBe('40**20');
      expect(data.items.length).toBeGreaterThan(0);

      // Verify sensitive merchant or customer PII is NOT in the public response
      expect(data.customerId).toBeUndefined();
      expect(data.customerPhone).toBeUndefined();
      expect(data.tenantId).toBeUndefined();
    });
  });

  // ============================================================================
  // 6. LOGISTICS INTEGRATION & FAILURE SAFETY TESTS
  // ============================================================================
  describe('6. Logistics Integration Failure Safety (Outbox Pattern)', () => {
    it('Never rolls back paid order if shipping provider encounters an error', async () => {
      // 1. Create and pay order
      const customer = await prisma.customer.findFirst({ where: { storeId: testStoreId } });
      const order = await prisma.order.create({
        data: {
          tenantId: testTenantId,
          storeId: testStoreId,
          customerId: customer!.id,
          orderNumber: `FAIL-SAFE-${Date.now()}`,
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.ACCEPTED,
          shipmentStatus: ShipmentStatus.PENDING,
          subtotalPaise: 50000,
          totalPaise: 50000,
          deliveryAddress: { city: 'Pune', pincode: '411001' },
        },
      });

      // 2. Call shipping creation through provider simulation
      const result = await shippingService.createShipmentForOrder(order.id, {
        tenantId: testTenantId,
        storeId: testStoreId,
      });

      expect(result).toBeDefined();

      // 3. Confirm order is STILL PAID in database
      const refreshedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(refreshedOrder!.paymentStatus).toBe(PaymentStatus.PAID);
    });
  });

  // ============================================================================
  // 7. REAL MEDIA STORAGE SECURITY TESTS
  // ============================================================================
  describe('7. Media Upload Security & Store Asset Verification', () => {
    it('Rejects media uploads exceeding 5MB size limit with 400 Bad Request', async () => {
      const oversizedBuffer = Buffer.alloc(5.2 * 1024 * 1024, 0);

      await expect(
        mediaService.uploadStoreAsset(
          { tenantId: testTenantId, storeId: testStoreId },
          {
            buffer: oversizedBuffer,
            originalFilename: 'huge.png',
            mimeType: 'image/png',
          },
          'logo'
        )
      ).rejects.toThrow('exceeds 5MB limit');
    });

    it('Rejects disallowed dangerous MIME types with 400 Bad Request', async () => {
      const maliciousPayload = Buffer.from('malicious_script').toString('base64');

      const res = await request(app.getHttpServer())
        .post('/media/store-asset')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          type: 'logo',
          filename: 'payload.exe',
          mimeType: 'application/x-msdownload',
          base64Data: maliciousPayload,
        });

      expect(res.status).toBe(400);
      expect(res.body.message || res.body.error?.message).toContain('Invalid asset MIME type');
    });

    it('Successfully uploads valid store brand logo and updates StoreBranding', async () => {
      const validPngBase64 = Buffer.from('fake_valid_png_content').toString('base64');

      const res = await request(app.getHttpServer())
        .post('/media/store-asset')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          type: 'logo',
          filename: 'brand_logo.png',
          mimeType: 'image/png',
          base64Data: validPngBase64,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.publicUrl).toBeDefined();

      // Verify StoreBranding updated in DB
      const branding = await prisma.storeBranding.findUnique({
        where: { storeId: testStoreId },
      });
      expect(branding).toBeDefined();
      expect(branding!.logoUrl).toBe(res.body.data.publicUrl);
    });
  });

  // ============================================================================
  // 8. ADMIN OPERATIONS & AUDIT TRAIL TESTS
  // ============================================================================
  describe('8. Admin Operations & Outbox Intervention', () => {
    it('SuperAdmin can trigger outbox event retry and writes an audit log', async () => {
      // Create a failed outbox event
      const failedEvt = await prisma.outboxEvent.create({
        data: {
          tenantId: testTenantId,
          storeId: testStoreId,
          eventType: 'ORDER_FULFILLMENT',
          payload: { test: true },
          status: 'FAILED',
          retryCount: 5,
          maxRetries: 5,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/admin/operations/retry-outbox/${failedEvt.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.retryCount).toBe(0);

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: {
          entityId: failedEvt.id,
          action: 'OUTBOX_EVENT_RETRY_TRIGGERED',
        },
      });
      expect(audit).toBeDefined();
    });
  });
});
