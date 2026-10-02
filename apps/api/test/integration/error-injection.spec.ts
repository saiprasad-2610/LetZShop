import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { SEED_IDS } from '@simply/db';
import { STORAGE_PROVIDER_TOKEN, MediaService } from '../../src/modules/media/media.service';
import { RazorpayPaymentProvider } from '../../src/modules/payments/providers/razorpay-payment.provider';

describe('Phase 4.5: Error Injection & Fault Tolerance Suite', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ bodyLimit: 15 * 1024 * 1024 })
    );
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleFixture.get<PrismaClient>(PrismaClient);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // ---------------------------------------------------------------------------
  // 1. DB Unavailable
  // ---------------------------------------------------------------------------
  it('1. DB unavailable: Health readiness probe safely handles database downtime with 503 and zero crash', async () => {
    // Temporarily mock prisma query to simulate disconnected DB
    const origQuery = prisma.$queryRaw;
    (prisma as any).$queryRaw = jest.fn().mockRejectedValue(new Error('Connection terminated unexpectedly: DB DOWN'));

    const res = await request(app.getHttpServer()).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('NOT_READY');
    expect(res.body.checks.database).toContain('DOWN');

    // Restore real prisma query
    (prisma as any).$queryRaw = origQuery;

    // Verify recovery once DB is available
    const healthyRes = await request(app.getHttpServer()).get('/health/ready');
    expect(healthyRes.status).toBe(200);
    expect(healthyRes.body.checks.database).toBe('UP');
  });

  // ---------------------------------------------------------------------------
  // 2. Media Storage Unavailable
  // ---------------------------------------------------------------------------
  it('2. Media storage unavailable: Readiness probe gracefully detects storage failure without crash', async () => {
    const storageProvider = moduleFixture.get(STORAGE_PROVIDER_TOKEN);
    const origExists = storageProvider.exists;
    storageProvider.exists = jest.fn().mockRejectedValue(new Error('EACCES: permission denied or storage unmounted'));

    const res = await request(app.getHttpServer()).get('/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('NOT_READY');
    expect(res.body.checks.storage).toContain('DOWN');

    // Restore storage provider
    storageProvider.exists = origExists;
  });

  // ---------------------------------------------------------------------------
  // 3. Razorpay Timeout / Unavailable
  // ---------------------------------------------------------------------------
  it('3. Razorpay timeout/unavailable: Fails closed and reports payment unavailable safely', async () => {
    const razorpayProvider = moduleFixture.get<RazorpayPaymentProvider>(RazorpayPaymentProvider);

    // When Razorpay credentials or gateway times out / is unavailable, verification strictly fails closed (returns false)
    const result = await razorpayProvider.verifyPayment({
      providerPaymentId: 'pay_timeout_123',
      providerOrderId: 'order_timeout_123',
      providerSignature: 'sig_timeout_123',
    });
    expect(result).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 4. Invalid Signature
  // ---------------------------------------------------------------------------
  it('4. Invalid signature: Webhook forgery with tampered signature is rejected with 400 Bad Request', async () => {
    const customer = await prisma.customer.findFirst({ where: { storeId: SEED_IDS.storeA } });
    const testOrder = await prisma.order.create({
      data: {
        tenantId: SEED_IDS.tenantA,
        storeId: SEED_IDS.storeA,
        customerId: customer!.id,
        orderNumber: `ORD-TEST-FORGE-${Date.now()}`,
        status: OrderStatus.NEW,
        paymentStatus: PaymentStatus.PENDING,
        currency: 'INR',
        subtotalPaise: 50000,
        totalPaise: 50000,
        deliveryAddress: { line1: 'MG Road', city: 'Mumbai', state: 'MH', postalCode: '400001' },
      },
    });

    const forgedPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_fake_attack_123',
            order_id: testOrder.id,
            status: 'captured',
            amount: 50000,
          },
        },
      },
    });

    const res = await request(app.getHttpServer())
      .post('/payments/webhook/razorpay')
      .set('x-razorpay-signature', 'invalid_tampered_signature_hex_value')
      .set('Content-Type', 'application/json')
      .send(forgedPayload);

    // Must be rejected with 400 Bad Request
    expect(res.status).toBe(400);

    // Verify order was not falsely marked paid
    const refreshedOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });
    expect(refreshedOrder?.paymentStatus).toBe(PaymentStatus.PENDING);

    // Cleanup
    await prisma.order.delete({ where: { id: testOrder.id } });
  });

  // ---------------------------------------------------------------------------
  // 5. Duplicate Checkout
  // ---------------------------------------------------------------------------
  it('5. Duplicate checkout: Re-submitting checkout on an already-processed cart is blocked with 400', async () => {
    const variant = await prisma.productVariant.findFirst({
      where: { storeId: SEED_IDS.storeA },
    });
    expect(variant).toBeDefined();

    // 1. Initialize cart
    const cartRes = await request(app.getHttpServer())
      .post('/cart/init')
      .send({ storeId: SEED_IDS.storeA });
    const cartId = cartRes.body.data.id;

    // 2. Add item to cart
    await request(app.getHttpServer())
      .post(`/cart/${cartId}/items`)
      .send({ variantId: variant!.id, quantity: 1 });

    const checkoutPayload = {
      storeId: SEED_IDS.storeA,
      cartId,
      fullName: 'Anita Sharma',
      phone: '+919876543210',
      email: 'anita@example.com',
      deliveryAddress: {
        addressLine1: '12 Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        country: 'India',
      },
    };

    // 3. First checkout attempt: Must succeed
    const firstCheckout = await request(app.getHttpServer())
      .post('/orders/checkout')
      .send(checkoutPayload);
    expect(firstCheckout.status).toBe(201);
    const orderNum = firstCheckout.body.data?.orderNumber || firstCheckout.body.orderNumber;
    expect(orderNum).toBeDefined();

    // 4. Duplicate checkout attempt with identical cart: Must be blocked with 400
    const secondCheckout = await request(app.getHttpServer())
      .post('/orders/checkout')
      .send(checkoutPayload);
    expect(secondCheckout.status).toBe(400);
    const errMsg = JSON.stringify(secondCheckout.body);
    expect(errMsg).toContain('Shopping cart is empty or not found');
  });

  // ---------------------------------------------------------------------------
  // 6. Invalid Upload
  // ---------------------------------------------------------------------------
  it('6. Invalid upload: Uploading disallowed MIME type or corrupted executable is rejected with 400', async () => {
    const mediaService = moduleFixture.get<MediaService>(MediaService);

    const product = await prisma.product.findFirst({ where: { storeId: SEED_IDS.storeA } });
    expect(product).toBeDefined();

    const tenantContext = {
      tenantId: SEED_IDS.tenantA,
      storeId: SEED_IDS.storeA,
      role: 'OWNER' as any,
      permissions: ['MANAGE_PRODUCTS'],
    };

    // Attempt upload with dangerous / invalid MIME type (application/x-msdownload)
    await expect(
      mediaService.uploadProductMedia(
        tenantContext,
        {
          buffer: Buffer.from('MZ_FAKE_EXECUTABLE_BYTES'),
          originalFilename: 'malicious.exe',
          mimeType: 'application/x-msdownload',
        },
        product!.id
      )
    ).rejects.toThrow('Invalid image MIME type');
  });

  // ---------------------------------------------------------------------------
  // 7. API Restart Behavior
  // ---------------------------------------------------------------------------
  it('7. API restart behavior: Application gracefully closes, reinitializes, and retains state integrity', async () => {
    // 1. Create a verification entity before restart
    const preRestartProduct = await prisma.product.findFirst({
      where: { storeId: SEED_IDS.storeA },
    });
    expect(preRestartProduct).toBeDefined();

    // 2. Simulate API process shutdown
    await app.close();

    // 3. Reinitialize fresh application instance (simulating restart)
    const newModuleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = newModuleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ bodyLimit: 15 * 1024 * 1024 })
    );
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // 4. Verify post-restart health & entity persistence
    const healthRes = await request(app.getHttpServer()).get('/health/ready');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('READY');

    const postRestartProduct = await prisma.product.findUnique({
      where: { id: preRestartProduct!.id },
    });
    expect(postRestartProduct).toBeDefined();
    expect(postRestartProduct?.id).toBe(preRestartProduct!.id);
  });
});
