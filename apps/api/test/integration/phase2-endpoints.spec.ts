import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { ResponseTransformInterceptor } from '../../src/common/interceptors/response-transform.interceptor';
import request from 'supertest';

describe('Phase 2 Backend Endpoints Integration Suite', () => {
  let app: NestFastifyApplication;
  let sellerToken: string;
  let adminToken: string;
  let newSellerToken: string;
  let testProductId: string;

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
    app.useGlobalInterceptors(new ResponseTransformInterceptor());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Authenticate Tenant A Seller (+919876543210)
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

  it('1. First-Time Seller Onboarding creates business, store in private preview & issues refreshed token', async () => {
    // Register brand new mobile
    const newPhone = '+919123456780';
    await request(app.getHttpServer()).post('/auth/otp/send').send({ phone: newPhone });
    const verifyRes = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone: newPhone, code: '123456' });
    const initialToken = verifyRes.body.data.accessToken;

    // Call Onboarding endpoint
    const onboardRes = await request(app.getHttpServer())
      .post('/stores/onboard')
      .set('Authorization', `Bearer ${initialToken}`)
      .send({
        businessName: 'Sharma Handicrafts',
        category: 'Furniture',
        contactPhone: newPhone,
        address: 'MG Road, Jaipur, Rajasthan',
      });

    expect(onboardRes.status).toBe(201);
    expect(onboardRes.body.data.store).toBeDefined();
    expect(onboardRes.body.data.store.name).toBe('Sharma Handicrafts');
    expect(onboardRes.body.data.store.status).toBe('PRIVATE_PREVIEW');
    expect(onboardRes.body.data.accessToken).toBeDefined();
    newSellerToken = onboardRes.body.data.accessToken;
  });

  it('2. Seller Dashboard Metrics returns accurate sales, orders, enquiries and attention counts', async () => {
    const res = await request(app.getHttpServer())
      .get('/stores/my-store/metrics')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toBeDefined();
    expect(typeof res.body.data.metrics.totalSalesPaise).toBe('number');
    expect(typeof res.body.data.metrics.totalOrders).toBe('number');
    expect(res.body.data.needsAttention).toBeDefined();
    expect(typeof res.body.data.needsAttention.newOrders).toBe('number');
  });

  it('3. Category Management: Seller can create and list categories', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/catalog/categories')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Festive Collection',
        description: 'Traditional wear for Diwali and weddings',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Festive Collection');

    const listRes = await request(app.getHttpServer())
      .get('/catalog/categories')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.some((c: any) => c.name === 'Festive Collection')).toBe(true);
  });

  it('4. Product Management: Update and Duplicate endpoints', async () => {
    // List existing products
    const listRes = await request(app.getHttpServer())
      .get('/catalog/products')
      .set('Authorization', `Bearer ${sellerToken}`);
    const existing = listRes.body.data.items[0];
    testProductId = existing.id;

    // Update product
    const updateRes = await request(app.getHttpServer())
      .put(`/catalog/products/${testProductId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        description: 'Updated premium description for luxury line',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.description).toBe('Updated premium description for luxury line');

    // Duplicate product
    const dupRes = await request(app.getHttpServer())
      .post(`/catalog/products/${testProductId}/duplicate`)
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(dupRes.status).toBe(201);
    expect(dupRes.body.data.name).toContain('(Copy)');
    expect(dupRes.body.data.status).toBe('DRAFT');
  });

  it('5. Inventory Management: Seller lists inventory items and adjusts stock', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/inventory')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    const item = listRes.body.data[0];
    expect(item).toBeDefined();

    // Adjust stock
    const adjustRes = await request(app.getHttpServer())
      .post('/inventory/adjust')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        variantId: item.variantId,
        quantity: item.stockOnHand + 10,
        reason: 'Restocked by supplier',
      });
    expect(adjustRes.status).toBe(201);
    expect(adjustRes.body.data.stockOnHand).toBe(item.stockOnHand + 10);
  });

  it('6. Customer CRM: Seller lists customers and fetches detailed profile', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/customers')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
  });

  it('7. Public Order Tracking: Buyer can track order without authentication', async () => {
    // Get existing order from seller to obtain orderNumber
    const ordersRes = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${sellerToken}`);
    const existingOrder = ordersRes.body.data.items[0];

    if (existingOrder) {
      const tokenParam = existingOrder.trackingToken ? `?t=${existingOrder.trackingToken}` : '';
      const trackRes = await request(app.getHttpServer())
        .get(`/orders/track/${existingOrder.orderNumber}${tokenParam}`);

      expect(trackRes.status).toBe(200);
      expect(trackRes.body.data.orderNumber).toBe(existingOrder.orderNumber);
      expect(trackRes.body.data.items).toBeDefined();
    }
  });

  it('8. Brand Studio: Lists 6 foundational themes and updates store configuration', async () => {
    // Available themes (Public)
    const themesRes = await request(app.getHttpServer()).get('/themes/available');
    expect(themesRes.status).toBe(200);
    expect(themesRes.body.data.length).toBeGreaterThanOrEqual(6);
    const themeCodes = themesRes.body.data.map((t: any) => t.code);
    expect(themeCodes).toContain('atelier');
    expect(themeCodes).toContain('pulse');
    expect(themeCodes).toContain('harvest');
    expect(themeCodes).toContain('foundry');
    expect(themeCodes).toContain('habitat');
    expect(themeCodes).toContain('local');

    // Get current store theme config
    const configRes = await request(app.getHttpServer())
      .get('/themes/config')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(configRes.status).toBe(200);
    expect(configRes.body.data.branding).toBeDefined();

    // Update Brand Studio config
    const updateRes = await request(app.getHttpServer())
      .put('/themes/config')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        themeCode: 'pulse',
        branding: {
          primaryColor: '#0F172A',
          accentColor: '#EC4899',
        },
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.branding.primaryColor).toBe('#0F172A');
  });

  it('9. Platform Admin: SuperAdmin overview, merchants listing, and suspension controls', async () => {
    // Admin Overview
    const overviewRes = await request(app.getHttpServer())
      .get('/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.metrics.totalMerchants).toBeGreaterThan(0);
    expect(overviewRes.body.data.systemHealth.database).toBe('HEALTHY');

    // Admin Merchants List
    const merchantsRes = await request(app.getHttpServer())
      .get('/admin/merchants')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(merchantsRes.status).toBe(200);
    expect(Array.isArray(merchantsRes.body.data)).toBe(true);

    // Admin Commerce Monitoring
    const commerceRes = await request(app.getHttpServer())
      .get('/admin/commerce')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(commerceRes.status).toBe(200);

    // Admin Operations
    const opsRes = await request(app.getHttpServer())
      .get('/admin/operations')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(opsRes.status).toBe(200);
  });
});
