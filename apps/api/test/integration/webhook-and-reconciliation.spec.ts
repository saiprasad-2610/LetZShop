import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
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
import { AdminService } from '../../src/modules/admin/admin.service';
import { SubscriptionVisibilityService } from '../../src/modules/subscriptions/subscription-visibility.service';
import { IllegalPaymentBoundaryException } from '../../src/common/exceptions/domain.exceptions';

describe('Phase 3.1 - Razorpay Test Webhook, Reconciliation & Raw Body Security', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let paymentsService: PaymentsService;
  let razorpayProvider: RazorpayPaymentProvider;
  let adminService: AdminService;
  let visibilityService: SubscriptionVisibilityService;

  let sellerToken: string;
  let adminToken: string;
  let testTenantId: string;
  let testStoreId: string;
  let testUserId: string;
  let planProId: string;
  let planProPrice: number;

  const testWebhookSecret = 'test_webhook_secret_for_phase3_1_validation_32b';

  beforeAll(async () => {
    // Configure webhook secret in process.env for test suite
    process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET = testWebhookSecret;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
      { rawBody: true }
    );
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleFixture.get<PrismaClient>(PrismaClient);
    paymentsService = moduleFixture.get<PaymentsService>(PaymentsService);
    razorpayProvider = moduleFixture.get<RazorpayPaymentProvider>(RazorpayPaymentProvider);
    adminService = moduleFixture.get<AdminService>(AdminService);
    visibilityService = moduleFixture.get<SubscriptionVisibilityService>(SubscriptionVisibilityService);

    // Get a standard plan for testing
    const plan = (await prisma.plan.findFirst({ where: { code: 'PRO' } })) || (await prisma.plan.findFirst());
    expect(plan).toBeDefined();
    planProId = plan!.id;
    planProPrice = plan!.pricePaise;

    // Create an isolated fresh tenant and seller user
    const randomSuffix = `wh_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const phone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;

    const user = await prisma.user.create({
      data: {
        phone,
        email: `seller_${randomSuffix}@test.com`,
        fullName: 'Test Webhook Seller',
        role: 'SELLER_OWNER',
      },
    });
    testUserId = user.id;

    const tenant = await prisma.tenant.create({
      data: {
        name: `Webhook Store Tenant ${randomSuffix}`,
        slug: `tenant-wh-${randomSuffix}`,
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
        name: `Webhook Store ${randomSuffix}`,
        slug: `store-wh-${randomSuffix}`,
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

    // Create a platform admin user for reconciliation tests
    const adminPhone = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
    await prisma.user.create({
      data: {
        phone: adminPhone,
        email: `admin_${randomSuffix}@test.com`,
        fullName: 'Test Admin User',
        role: 'PLATFORM_ADMIN',
      },
    });
    await request(app.getHttpServer()).post('/auth/otp/send').send({ phone: adminPhone });
    const adminAuthRes = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: adminPhone, code: '123456' });
    adminToken = adminAuthRes.body.data.accessToken;
  });

  afterAll(async () => {
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
        await prisma.refund.deleteMany({
          where: { tenantId: testTenantId },
        });
        await prisma.paymentTransaction.deleteMany({
          where: { paymentOrder: { tenantId: testTenantId } },
        });
        await prisma.paymentOrder.deleteMany({
          where: { tenantId: testTenantId },
        });
        await prisma.paymentWebhookEvent.deleteMany({
          where: { provider: 'RAZORPAY' },
        });
        await prisma.auditLog.deleteMany({
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

  // Helper to generate HMAC SHA256 signature
  const signPayload = (payload: string, secret = testWebhookSecret) => {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  };

  // ============================================================================
  // 1. EXACT WEBHOOK ROUTE & SECRET VALIDATION
  // ============================================================================
  describe('1. Exact Webhook Route & Secret Validation', () => {
    it('determines and confirms the exact exposed webhook route /webhooks/razorpay', async () => {
      const res = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .send({ event: 'test.ping' });

      // Missing signature returns 400
      expect(res.status).toBe(400);
      expect(res.body.error?.message || res.body.message).toMatch(/Missing x-razorpay-signature/i);
    });

    it('fails closed when webhook secret is missing from environment', async () => {
      const originalSecret = process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET;
      const originalFallback = process.env.RAZORPAY_WEBHOOK_SECRET;

      delete process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET;
      delete process.env.RAZORPAY_WEBHOOK_SECRET;

      try {
        const body = JSON.stringify({ event: 'order.paid' });
        const res = await request(app.getHttpServer())
          .post('/webhooks/razorpay')
          .set('Content-Type', 'application/json')
          .set('x-razorpay-signature', 'dummy_signature')
          .send(body);

        expect(res.status).toBe(400);
        expect(res.body.error?.message || res.body.message).toMatch(/Webhook verification disabled: secret not configured/i);
      } finally {
        process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET = originalSecret;
        if (originalFallback) process.env.RAZORPAY_WEBHOOK_SECRET = originalFallback;
      }
    });

    it('rejects invalid or forged webhook signature', async () => {
      const body = JSON.stringify({ event: 'order.paid', id: `evt_${Date.now()}` });
      const res = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', 'invalid_forged_hex_signature')
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.error?.message || res.body.message).toMatch(/Invalid webhook signature/i);
    });
  });

  // ============================================================================
  // 2. RAW BODY INTEGRITY
  // ============================================================================
  describe('2. Raw Body Integrity & Modification Detection', () => {
    it('accepts original raw payload with valid HMAC, but rejects modified/reserialized body', async () => {
      // 1. Valid raw string
      const rawString = JSON.stringify({
        event: 'order.paid',
        id: `evt_raw_${Date.now()}`,
        payload: {
          order: {
            entity: {
              id: 'order_nonexistent_test',
              amount: 10000,
              currency: 'INR',
            },
          },
        },
      });

      const validSig = signPayload(rawString);

      // Verify the unaltered raw string is accepted by signature check
      const acceptedRes = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', validSig)
        .send(rawString);

      // Order non-existent returns 200 with status: 'ignored'
      expect(acceptedRes.status).toBe(200);

      // 2. Modify body slightly (tampered extra property) while keeping the original signature
      const modifiedBody = JSON.stringify({
        ...JSON.parse(rawString),
        tampered_field: 'injected_content',
      });

      const rejectedRes = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', validSig) // Using signature for original rawString!
        .send(modifiedBody);

      expect(rejectedRes.status).toBe(400);
      expect(rejectedRes.body.error?.message || rejectedRes.body.message).toMatch(/Invalid webhook signature/i);
    });
  });

  // ============================================================================
  // 3. PAYMENT SUCCESS WITH BROWSER CALLBACK MISSING (RECONCILIATION)
  // ============================================================================
  describe('3. Payment Success with Browser Callback Missing', () => {
    it('activates subscription and makes store LIVE via webhook when buyer closes browser before checkout verify', async () => {
      // Create fresh tenant for this test
      const tSuffix = `miss_${Date.now()}`;
      const tenant = await prisma.tenant.create({
        data: { name: `Miss Tenant ${tSuffix}`, slug: `miss-${tSuffix}` },
      });
      const store = await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name: `Miss Store ${tSuffix}`,
          slug: `miss-store-${tSuffix}`,
          status: StoreStatus.PRIVATE_PREVIEW,
          isPubliclyAccessible: false,
        },
      });

      // 1. Create subscription order
      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        tenant.id,
        planProId,
        'MONTHLY',
        undefined,
        true
      );
      expect(subOrder.paymentOrderId).toBeDefined();

      // Verify store is initially PRIVATE
      let currentStore = await prisma.store.findUnique({ where: { id: store.id } });
      expect(currentStore!.status).toBe(StoreStatus.PRIVATE_PREVIEW);
      expect(currentStore!.isPubliclyAccessible).toBe(false);

      // 2. Browser closes! No call to /subscriptions/verify.
      // Instead, Razorpay sends payment.captured webhook to /webhooks/razorpay:
      const evtId = `evt_miss_${Date.now()}`;
      const mockPayId = `pay_miss_${Date.now()}`;
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        id: evtId,
        payload: {
          payment: {
            entity: {
              id: mockPayId,
              order_id: subOrder.providerOrderId,
              amount: planProPrice,
              currency: 'INR',
              status: 'captured',
            },
          },
          order: {
            entity: {
              id: subOrder.providerOrderId,
              amount: planProPrice,
              currency: 'INR',
              status: 'paid',
            },
          },
        },
      });

      const sig = signPayload(webhookPayload);
      const whRes = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', sig)
        .send(webhookPayload);

      expect(whRes.status).toBe(200);
      expect(whRes.body.data?.status || whRes.body.status).toBe('processed');

      // 3. Verify store is now LIVE and publicly accessible
      currentStore = await prisma.store.findUnique({ where: { id: store.id } });
      expect(currentStore!.status).toBe(StoreStatus.LIVE);
      expect(currentStore!.isPubliclyAccessible).toBe(true);

      // 4. Verify subscription is ACTIVE with valid currentPeriodEnd
      const sub = await prisma.subscription.findFirst({
        where: { tenantId: tenant.id },
      });
      expect(sub).toBeDefined();
      expect(sub!.status).toBe(SubscriptionStatus.ACTIVE);
      expect(sub!.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());

      // 5. Verify Invoice and SubscriptionPayment exist
      const invoice = await prisma.subscriptionInvoice.findFirst({
        where: { tenantId: tenant.id },
      });
      expect(invoice).toBeDefined();
      expect(invoice!.status).toBe('PAID');
      expect(invoice!.amountPaise).toBe(planProPrice);

      const subPayment = await prisma.subscriptionPayment.findFirst({
        where: { invoiceId: invoice!.id },
      });
      expect(subPayment).toBeDefined();
      expect(subPayment!.status).toBe('SUCCESS');
    });
  });

  // ============================================================================
  // 4. SUBSCRIPTION ACTIVATION IDEMPOTENCY & DUPLICATE WEBHOOKS
  // ============================================================================
  describe('4. Activation Idempotency (Checkout Verify + Multiple Webhooks)', () => {
    it('ensures checkout verify + order.paid + payment.captured + retries produces exactly ONE subscription & ONE invoice', async () => {
      const iSuffix = `idem_${Date.now()}`;
      const tenant = await prisma.tenant.create({
        data: { name: `Idem Tenant ${iSuffix}`, slug: `idem-${iSuffix}` },
      });
      await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name: `Idem Store ${iSuffix}`,
          slug: `idem-store-${iSuffix}`,
          status: StoreStatus.PRIVATE_PREVIEW,
          isPubliclyAccessible: false,
        },
      });

      // 1. Create order
      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        tenant.id,
        planProId,
        'MONTHLY',
        undefined,
        true
      );

      // 2. Immediate checkout verification succeeds
      const mockPayId = `pay_idem_${Date.now()}`;
      const payloadStr = `${subOrder.providerOrderId}|${mockPayId}`;
      const checkoutSig = crypto
        .createHmac('sha256', razorpayProvider.platformKeySecret!)
        .update(payloadStr)
        .digest('hex');

      const checkoutRes = await paymentsService.verifyAndCapturePayment({
        paymentOrderId: subOrder.paymentOrderId,
        providerPaymentId: mockPayId,
        providerOrderId: subOrder.providerOrderId,
        providerSignature: checkoutSig,
      });
      expect(checkoutRes.success).toBe(true);

      // 3. Webhook: order.paid arrives
      const orderPaidEvt = `evt_op_${Date.now()}`;
      const orderPaidPayload = JSON.stringify({
        event: 'order.paid',
        id: orderPaidEvt,
        payload: {
          order: {
            entity: {
              id: subOrder.providerOrderId,
              amount: planProPrice,
              currency: 'INR',
              status: 'paid',
            },
          },
          payment: {
            entity: {
              id: mockPayId,
              order_id: subOrder.providerOrderId,
              amount: planProPrice,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      });
      const orderPaidSig = signPayload(orderPaidPayload);

      const opRes = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', orderPaidSig)
        .send(orderPaidPayload);
      expect(opRes.status).toBe(200);

      // 4. Webhook: payment.captured arrives
      const payCapEvt = `evt_pc_${Date.now()}`;
      const payCapPayload = JSON.stringify({
        event: 'payment.captured',
        id: payCapEvt,
        payload: {
          payment: {
            entity: {
              id: mockPayId,
              order_id: subOrder.providerOrderId,
              amount: planProPrice,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      });
      const payCapSig = signPayload(payCapPayload);

      const pcRes = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', payCapSig)
        .send(payCapPayload);
      expect(pcRes.status).toBe(200);

      // 5. Razorpay retries order.paid webhook
      const retryRes = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', orderPaidSig)
        .send(orderPaidPayload);
      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data?.status || retryRes.body.status).toBe('already_processed');

      // 6. Verify strictly ONE subscription, ONE invoice, and ONE payment record exist
      const subscriptions = await prisma.subscription.findMany({
        where: { tenantId: tenant.id },
      });
      expect(subscriptions.length).toBe(1);

      const invoices = await prisma.subscriptionInvoice.findMany({
        where: { tenantId: tenant.id },
      });
      expect(invoices.length).toBe(1);

      const payments = await prisma.subscriptionPayment.findMany({
        where: { invoice: { tenantId: tenant.id } },
      });
      expect(payments.length).toBe(1);
    });

    it('handles webhook arriving first followed by browser checkout verification', async () => {
      const wSuffix = `wh_first_${Date.now()}`;
      const tenant = await prisma.tenant.create({
        data: { name: `WH First Tenant ${wSuffix}`, slug: `wh-first-${wSuffix}` },
      });
      await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name: `WH First Store ${wSuffix}`,
          slug: `wh-first-store-${wSuffix}`,
          status: StoreStatus.PRIVATE_PREVIEW,
          isPubliclyAccessible: false,
        },
      });

      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        tenant.id,
        planProId,
        'MONTHLY',
        undefined,
        true
      );

      // 1. Webhook arrives first and marks PAID
      const mockPayId = `pay_whf_${Date.now()}`;
      const whPayload = JSON.stringify({
        event: 'order.paid',
        id: `evt_whf_${Date.now()}`,
        payload: {
          order: {
            entity: {
              id: subOrder.providerOrderId,
              amount: planProPrice,
              currency: 'INR',
              status: 'paid',
            },
          },
          payment: {
            entity: {
              id: mockPayId,
              order_id: subOrder.providerOrderId,
              amount: planProPrice,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      });
      const whSig = signPayload(whPayload);
      await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', whSig)
        .send(whPayload);

      // 2. Buyer browser later completes /subscriptions/verify
      const payloadStr = `${subOrder.providerOrderId}|${mockPayId}`;
      const checkoutSig = crypto
        .createHmac('sha256', razorpayProvider.platformKeySecret!)
        .update(payloadStr)
        .digest('hex');

      const clientVerifyRes = await paymentsService.verifyAndCapturePayment({
        paymentOrderId: subOrder.paymentOrderId,
        providerPaymentId: mockPayId,
        providerOrderId: subOrder.providerOrderId,
        providerSignature: checkoutSig,
      });

      expect(clientVerifyRes.success).toBe(true);
      expect((clientVerifyRes as any).message).toBe('Payment already verified and processed.');

      // Check strictly 1 invoice
      const invoices = await prisma.subscriptionInvoice.findMany({
        where: { tenantId: tenant.id },
      });
      expect(invoices.length).toBe(1);
    });
  });

  // ============================================================================
  // 5. OUT-OF-ORDER WEBHOOKS & STALE FAILURES
  // ============================================================================
  describe('5. Out-of-Order Webhooks & Stale Failure Protection', () => {
    it('does not downgrade a PAID payment when a stale payment.failed webhook arrives', async () => {
      const sSuffix = `stale_${Date.now()}`;
      const tenant = await prisma.tenant.create({
        data: { name: `Stale Tenant ${sSuffix}`, slug: `stale-${sSuffix}` },
      });
      const store = await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name: `Stale Store ${sSuffix}`,
          slug: `stale-store-${sSuffix}`,
          status: StoreStatus.PRIVATE_PREVIEW,
          isPubliclyAccessible: false,
        },
      });

      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        tenant.id,
        planProId,
        'MONTHLY',
        undefined,
        true
      );

      // Mark order as PAID first
      await prisma.paymentOrder.update({
        where: { id: subOrder.paymentOrderId },
        data: { status: PaymentStatus.PAID },
      });
      await prisma.store.update({
        where: { id: store.id },
        data: { status: StoreStatus.LIVE, isPubliclyAccessible: true },
      });

      // Now a stale/delayed payment.failed event arrives from Razorpay
      const staleFailPayload = JSON.stringify({
        event: 'payment.failed',
        id: `evt_stale_fail_${Date.now()}`,
        payload: {
          payment: {
            entity: {
              id: `pay_failed_stale_${Date.now()}`,
              order_id: subOrder.providerOrderId,
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Payment timed out',
            },
          },
        },
      });
      const sig = signPayload(staleFailPayload);

      const res = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', sig)
        .send(staleFailPayload);

      expect(res.status).toBe(200);

      // Verify payment order status remains PAID
      const checkOrder = await prisma.paymentOrder.findUnique({
        where: { id: subOrder.paymentOrderId },
      });
      expect(checkOrder!.status).toBe(PaymentStatus.PAID);

      // Verify store remains LIVE
      const checkStore = await prisma.store.findUnique({ where: { id: store.id } });
      expect(checkStore!.status).toBe(StoreStatus.LIVE);
      expect(checkStore!.isPubliclyAccessible).toBe(true);

      // Verify audit log recorded the ignored stale failure
      const audit = await prisma.auditLog.findFirst({
        where: { tenantId: tenant.id, action: 'STALE_PAYMENT_FAILED_IGNORED' },
      });
      expect(audit).toBeDefined();
    });
  });

  // ============================================================================
  // 6. TAMPERED AMOUNT & CURRENCY PROTECTION
  // ============================================================================
  describe('6. Webhook Tampered Amount & Currency Protection', () => {
    it('rejects webhook when amount differs from authoritative internal order', async () => {
      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        testTenantId,
        planProId,
        'MONTHLY',
        undefined,
        true
      );

      const tamperedAmountPayload = JSON.stringify({
        event: 'order.paid',
        id: `evt_tamp_amt_${Date.now()}`,
        payload: {
          order: {
            entity: {
              id: subOrder.providerOrderId,
              amount: 100, // Tampered amount vs planProPrice (e.g. 99900)
              currency: 'INR',
            },
          },
        },
      });
      const sig = signPayload(tamperedAmountPayload);

      const res = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', sig)
        .send(tamperedAmountPayload);

      expect(res.status).toBe(400);
      expect(res.body.error?.message || res.body.message).toMatch(/tampered amount detected/i);
    });

    it('rejects webhook when currency differs from internal order', async () => {
      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        testTenantId,
        planProId,
        'MONTHLY',
        undefined,
        true
      );

      const tamperedCurrencyPayload = JSON.stringify({
        event: 'order.paid',
        id: `evt_tamp_cur_${Date.now()}`,
        payload: {
          order: {
            entity: {
              id: subOrder.providerOrderId,
              amount: planProPrice,
              currency: 'USD', // Tampered currency vs INR
            },
          },
        },
      });
      const sig = signPayload(tamperedCurrencyPayload);

      const res = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', sig)
        .send(tamperedCurrencyPayload);

      expect(res.status).toBe(400);
      expect(res.body.error?.message || res.body.message).toMatch(/currency mismatch/i);
    });
  });

  // ============================================================================
  // 7. REFUND WEBHOOK & PROVIDER METHOD
  // ============================================================================
  // ============================================================================
  // 7. REFUND POLICY, SELLER PREVIEW, IDEMPOTENCY & FAIL-CLOSED ENFORCEMENT
  // ============================================================================
  describe('7. Refund Policy, Seller Preview, Webhook Idempotency & Fail-Closed Credentials', () => {
    it('full subscription refund immediately disables public store, preserves seller data, and allows private preview', async () => {
      const rSuffix = `rfnd_${Date.now()}`;
      const tenant = await prisma.tenant.create({
        data: { name: `Refund Tenant ${rSuffix}`, slug: `refund-${rSuffix}` },
      });
      const store = await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name: `Refund Store ${rSuffix}`,
          slug: `refund-store-${rSuffix}`,
          status: StoreStatus.LIVE,
          isPubliclyAccessible: true,
        },
      });

      // Create product & category to verify seller data preservation
      const category = await prisma.category.create({
        data: {
          tenantId: tenant.id,
          storeId: store.id,
          name: 'Precision Milling',
          slug: `milling-${rSuffix}`,
        },
      });
      const product = await prisma.product.create({
        data: {
          tenantId: tenant.id,
          storeId: store.id,
          name: 'CNC Lathe Machine',
          slug: `cnc-lathe-${rSuffix}`,
          categoryId: category.id,
        },
      });

      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        tenant.id,
        planProId,
        'MONTHLY',
        undefined,
        true
      );

      // Verify payment and mark PAID
      const mockPayId = `pay_to_refund_${Date.now()}`;
      const sig = crypto
        .createHmac('sha256', razorpayProvider.platformKeySecret!)
        .update(`${subOrder.providerOrderId}|${mockPayId}`)
        .digest('hex');

      await paymentsService.verifyAndCapturePayment({
        paymentOrderId: subOrder.paymentOrderId,
        providerPaymentId: mockPayId,
        providerOrderId: subOrder.providerOrderId,
        providerSignature: sig,
      });

      // Verify initial active state: store is LIVE & public
      const preRefundStore = await prisma.store.findUnique({ where: { id: store.id } });
      expect(preRefundStore!.status).toBe(StoreStatus.LIVE);
      expect(preRefundStore!.isPubliclyAccessible).toBe(true);

      const preRefundSub = await prisma.subscription.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(preRefundSub!.status).toBe(SubscriptionStatus.ACTIVE);

      // 1. Process refund via paymentsService method
      const tx = await prisma.paymentTransaction.findFirst({
        where: { paymentOrderId: subOrder.paymentOrderId },
      });
      expect(tx).toBeDefined();

      const refundResult = await paymentsService.refundPaymentTransaction(
        tx!.id,
        planProPrice,
        'Full SaaS subscription cancellation refund'
      );
      expect(refundResult.status).toBe('processed');
      expect(refundResult.amountPaise).toBe(planProPrice);

      // 2. Verify PaymentOrder is REFUNDED
      const checkOrder = await prisma.paymentOrder.findUnique({
        where: { id: subOrder.paymentOrderId },
      });
      expect(checkOrder!.status).toBe(PaymentStatus.REFUNDED);

      // 3. POLICY: Subscription is CANCELED
      const postRefundSub = await prisma.subscription.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(postRefundSub!.status).toBe(SubscriptionStatus.CANCELED);

      // 4. POLICY: Store is immediately set to PRIVATE_PREVIEW and isPubliclyAccessible = false
      const postRefundStore = await prisma.store.findUnique({ where: { id: store.id } });
      expect(postRefundStore!.status).toBe(StoreStatus.PRIVATE_PREVIEW);
      expect(postRefundStore!.isPubliclyAccessible).toBe(false);

      // 5. POLICY: Public buyer access is completely disabled
      await expect(
        visibilityService.evaluateVisibility(store.id)
      ).rejects.toThrow();

      // 6. POLICY: Seller can still log in and privately preview store after refund
      const sellerPreview = await visibilityService.evaluateVisibility(store.id, {
        authenticatedUser: { tenantId: tenant.id, role: 'SELLER_OWNER' } as any,
      });
      expect(sellerPreview).toBeDefined();
      expect(sellerPreview.isPreview).toBe(true);
      expect(sellerPreview.store.id).toBe(store.id);

      // 7. POLICY: Seller products, media, branding, and data are strictly preserved (never deleted)
      const preservedProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(preservedProduct).toBeDefined();
      expect(preservedProduct!.name).toBe('CNC Lathe Machine');

      const preservedCategory = await prisma.category.findUnique({ where: { id: category.id } });
      expect(preservedCategory).toBeDefined();

      // 8. POLICY: Immutable audit log written
      const deactivationAudit = await prisma.auditLog.findFirst({
        where: {
          tenantId: tenant.id,
          action: 'SUBSCRIPTION_REFUNDED_STORE_DEACTIVATED',
        },
      });
      expect(deactivationAudit).toBeDefined();
      expect((deactivationAudit!.metadata as any)?.dataPreserved).toBe(true);

      // 9. Process refund.processed webhook and verify idempotency
      const refundEvtPayload = JSON.stringify({
        event: 'refund.processed',
        id: `evt_rfnd_${Date.now()}`,
        payload: {
          refund: {
            entity: {
              id: refundResult.providerRefundId,
              payment_id: mockPayId,
              amount: planProPrice,
              status: 'processed',
              notes: { reason: 'SaaS plan cancellation refund' },
            },
          },
        },
      });
      const whSig = signPayload(refundEvtPayload);

      const whRes = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', whSig)
        .send(refundEvtPayload);
      expect(whRes.status).toBe(200);

      // 10. Duplicate refund webhook remains idempotent
      const duplicateWhRes = await request(app.getHttpServer())
        .post('/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', whSig)
        .send(refundEvtPayload);
      expect(duplicateWhRes.status).toBe(200);
      expect(duplicateWhRes.body.data?.status || duplicateWhRes.body.status).toBe('already_processed');

      // Store and subscription remain CANCELED / PRIVATE_PREVIEW
      const finalStore = await prisma.store.findUnique({ where: { id: store.id } });
      expect(finalStore!.status).toBe(StoreStatus.PRIVATE_PREVIEW);
      expect(finalStore!.isPubliclyAccessible).toBe(false);
    });

    it('fails closed when RAZORPAY_PLATFORM_KEY_ID is missing', async () => {
      const origKeyId = process.env.RAZORPAY_PLATFORM_KEY_ID;
      const origFallback = process.env.RAZORPAY_KEY_ID;
      try {
        delete process.env.RAZORPAY_PLATFORM_KEY_ID;
        delete process.env.RAZORPAY_KEY_ID;

        await expect(
          paymentsService.createPlatformSubscriptionPaymentOrder(
            testTenantId,
            planProId,
            'MONTHLY',
            undefined,
            true
          )
        ).rejects.toThrow(BadRequestException);
      } finally {
        if (origKeyId) process.env.RAZORPAY_PLATFORM_KEY_ID = origKeyId;
        if (origFallback) process.env.RAZORPAY_KEY_ID = origFallback;
      }
    });

    it('fails closed when RAZORPAY_PLATFORM_KEY_SECRET is missing', async () => {
      const origKeySecret = process.env.RAZORPAY_PLATFORM_KEY_SECRET;
      const origFallback = process.env.RAZORPAY_KEY_SECRET;
      try {
        delete process.env.RAZORPAY_PLATFORM_KEY_SECRET;
        delete process.env.RAZORPAY_KEY_SECRET;

        await expect(
          paymentsService.createPlatformSubscriptionPaymentOrder(
            testTenantId,
            planProId,
            'MONTHLY',
            undefined,
            true
          )
        ).rejects.toThrow(BadRequestException);

        await expect(
          razorpayProvider.verifyPayment({
            providerOrderId: 'order_test_fake',
            providerPaymentId: 'pay_test_fake',
            providerSignature: 'sig_fake',
          })
        ).rejects.toThrow(BadRequestException);
      } finally {
        if (origKeySecret) process.env.RAZORPAY_PLATFORM_KEY_SECRET = origKeySecret;
        if (origFallback) process.env.RAZORPAY_KEY_SECRET = origFallback;
      }
    });
  });

  // ============================================================================
  // 8. DASHBOARD RECONCILIATION TOOL & AUDIT
  // ============================================================================
  describe('8. Dashboard Reconciliation Tool & Audit', () => {
    it('compares gateway state with internal DB, reconciles discrepancies, and creates audit log', async () => {
      const recSuffix = `rec_${Date.now()}`;
      const tenant = await prisma.tenant.create({
        data: { name: `Reconcile Tenant ${recSuffix}`, slug: `rec-${recSuffix}` },
      });
      await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name: `Reconcile Store ${recSuffix}`,
          slug: `rec-store-${recSuffix}`,
          status: StoreStatus.PRIVATE_PREVIEW,
          isPubliclyAccessible: false,
        },
      });

      const subOrder = await paymentsService.createPlatformSubscriptionPaymentOrder(
        tenant.id,
        planProId,
        'MONTHLY',
        undefined,
        true
      );

      // Mock gateway response indicating payment is actually paid on Razorpay
      const originalGetOrder = razorpayProvider.getOrder;
      razorpayProvider.getOrder = jest.fn().mockResolvedValue({
        id: subOrder.providerOrderId,
        status: 'paid',
        amount: planProPrice,
        amount_paid: planProPrice,
      });

      try {
        const reconcileRes = await request(app.getHttpServer())
          .post(`/admin/operations/reconcile-payment/${subOrder.paymentOrderId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(reconcileRes.status).toBe(201);
        const data = reconcileRes.body.data || reconcileRes.body;
        expect(data.paymentOrderId).toBe(subOrder.paymentOrderId);
        expect(data.actionTaken).toBe('RECONCILED_TO_PAID');
        expect(data.currentStatus).toBe(PaymentStatus.PAID);

        // Verify audit log
        const audit = await prisma.auditLog.findFirst({
          where: { tenantId: tenant.id, action: 'MANUAL_PAYMENT_RECONCILIATION' },
        });
        expect(audit).toBeDefined();
        expect((audit!.metadata as any).actionTaken).toBe('RECONCILED_TO_PAID');
      } finally {
        razorpayProvider.getOrder = originalGetOrder;
      }
    });
  });

  // ============================================================================
  // 9. HEALTH / PROVIDER STATUS
  // ============================================================================
  describe('9. Health & Provider Status Check', () => {
    it('returns provider configuration status without exposing secrets or calling gateway APIs', async () => {
      const res = await request(app.getHttpServer()).get('/health/providers');
      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(data.status).toBe('UP');
      expect(data.providers).toBeDefined();
      expect(data.providers.razorpay).toBe('Configured');
      expect(data.providers.webhook).toBe('Configured');

      // Verify NO secrets are leaked in response
      const jsonStr = JSON.stringify(res.body);
      expect(jsonStr).not.toContain(razorpayProvider.platformKeySecret);
      expect(jsonStr).not.toContain(testWebhookSecret);
    });
  });
});
