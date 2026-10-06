import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { SEED_IDS } from '@simply/db';
import { PrismaClient, StoreStatus, SubscriptionStatus } from '@prisma/client';
import request from 'supertest';

describe('API End-to-End Suite (Full Platform Journey)', () => {
  let app: NestFastifyApplication;
  let sellerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      })
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const prisma = moduleFixture.get<PrismaClient>(PrismaClient);
    await prisma.store.update({
      where: { id: SEED_IDS.storeB },
      data: { status: StoreStatus.PRIVATE_PREVIEW, isPubliclyAccessible: false },
    });
    await prisma.subscription.updateMany({
      where: { tenantId: SEED_IDS.tenantB },
      data: { status: SubscriptionStatus.UNPAID },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Observability: GET /health returns liveness status UP', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.brand).toBeDefined();
  });

  it('2. Observability: GET /health/ready verifies DB & storage', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
    expect(res.body.checks.database).toBe('UP');
    expect(res.body.checks.storage).toBe('UP');
  });

  it('3. Seller Auth: Phone OTP send and verify flow', async () => {
    // A. Request OTP
    const sendRes = await request(app.getHttpServer())
      .post('/auth/otp/send')
      .send({ phone: '+919876543210' });
    expect(sendRes.status).toBe(200);
    expect(sendRes.body.data.success).toBe(true);

    // B. Verify OTP with dev code '123456'
    const verifyRes = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: '+919876543210', code: '123456' });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.accessToken).toBeDefined();
    expect(verifyRes.body.data.refreshToken).toBeDefined();
    expect(verifyRes.body.data.user.phone).toBe('+919876543210');

    sellerToken = verifyRes.body.data.accessToken;

    // C. Check /auth/me with bearer token
    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.phone).toBe('+919876543210');
  });

  it('4. Subscription Gating: Paid store is accessible, Unpaid store is blocked', async () => {
    // A. Paid store (Aurelia Atelier)
    const paidRes = await request(app.getHttpServer()).get('/storefront/aurelia');
    expect(paidRes.status).toBe(200);
    expect(paidRes.body.data.store.name).toBe('Aurelia Atelier');
    expect(paidRes.body.data.isPreview).toBe(false);

    // B. Unpaid store (Patil Engineering) - blocked from public
    const unpaidRes = await request(app.getHttpServer()).get('/storefront/patil-engineering');
    expect(unpaidRes.status).toBe(402); // PAYMENT REQUIRED
    expect(['SUBSCRIPTION_REQUIRED', 'STORE_SUBSCRIPTION_REQUIRED']).toContain(unpaidRes.body.error.code);
  });

  it('5. Guest Shopping Flow: Cart -> Checkout -> Payment Order -> Verification', async () => {
    // Step A: Initialize guest cart
    const cartRes = await request(app.getHttpServer())
      .post('/cart/init')
      .send({ storeId: SEED_IDS.storeA });
    expect(cartRes.status).toBe(201);
    const cartId = cartRes.body.data.id;
    expect(cartId).toBeDefined();

    // Step B: Add item to cart (Linen shirt Navy S)
    const addItemRes = await request(app.getHttpServer())
      .post(`/cart/${cartId}/items`)
      .send({ variantId: SEED_IDS.variantA1NavyS, quantity: 1 });
    expect(addItemRes.status).toBe(201);

    // Step C: Check cart total
    const getCartRes = await request(app.getHttpServer()).get(`/cart/${cartId}`);
    expect(getCartRes.status).toBe(200);
    expect(getCartRes.body.data.subtotalPaise).toBe(249900);

    // Step D: Guest Checkout
    const checkoutRes = await request(app.getHttpServer())
      .post('/orders/checkout')
      .send({
        storeId: SEED_IDS.storeA,
        cartId,
        fullName: 'Kavita Pillai',
        phone: '+919833445566',
        email: 'kavita@example.com',
        deliveryAddress: {
          addressLine1: 'Villa 12, Palm Meadows',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560066',
        },
      });

    expect(checkoutRes.status).toBe(201);
    const order = checkoutRes.body.data;
    expect(order.orderNumber).toBeDefined();
    expect(order.paymentStatus).toBe('PENDING');

    // Step E: Create Payment Order
    const payOrderRes = await request(app.getHttpServer())
      .post('/payments/orders')
      .send({ orderId: order.id });
    expect(payOrderRes.status).toBe(201);
    const paymentOrder = payOrderRes.body.data;
    expect(paymentOrder.providerOrderId).toBeDefined();

    // Step F: Verify Payment
    const verifyPayRes = await request(app.getHttpServer())
      .post('/payments/verify')
      .send({
        paymentOrderId: paymentOrder.paymentOrderId,
        providerPaymentId: `pay_${Date.now()}`,
        providerSignature: 'valid_mock_signature',
      });

    expect(verifyPayRes.status).toBe(200);
    expect(verifyPayRes.body.data.paymentStatus).toBe('PAID');
    expect(verifyPayRes.body.data.status).toBe('ACCEPTED');
  });
});
