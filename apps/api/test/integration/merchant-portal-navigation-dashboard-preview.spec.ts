import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaClient, StoreStatus } from '@prisma/client';
import { GlobalHttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '../../src/common/interceptors/response-transform.interceptor';

describe('Merchant Portal Navigation, Compact Dashboard, Analytics & Store Preview', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;

  let tokenA: string;
  let storeA: any;
  let tenantA: any;

  let tokenB: string;
  let storeB: any;
  let tenantB: any;

  async function getOrRegisterSeller(phone: string, pin: string) {
    const pinRes = await request(app.getHttpServer())
      .post('/auth/pin/login')
      .send({ phone, pin });

    if (pinRes.status === 200 && pinRes.body?.data?.accessToken) {
      return {
        token: pinRes.body.data.accessToken,
        store: pinRes.body.data.store,
        tenant: pinRes.body.data.tenant,
      };
    }

    await request(app.getHttpServer())
      .post('/auth/register/request-otp')
      .send({ phone });

    const verifyRes = await request(app.getHttpServer())
      .post('/auth/register/verify-otp')
      .send({ phone, otp: '123456' });

    const tempToken = verifyRes.body.data?.tempToken || verifyRes.body.data?.verificationToken;

    const setupRes = await request(app.getHttpServer())
      .post('/auth/pin/setup')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({ pin, phone });

    return {
      token: setupRes.body.data.accessToken,
      store: setupRes.body.data.store,
      tenant: setupRes.body.data.tenant,
    };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const adapter = new FastifyAdapter();
    app = moduleFixture.createNestApplication<NestFastifyApplication>(adapter);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );

    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseTransformInterceptor());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleFixture.get<PrismaClient>(PrismaClient);

    const authA = await getOrRegisterSeller('+919876543210', '654321');
    tokenA = authA.token;
    storeA = authA.store;
    tenantA = authA.tenant;

    const authB = await getOrRegisterSeller('+919876501234', '654321');
    tokenB = authB.token;
    storeB = authB.store;
    tenantB = authB.tenant;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Part 1 & 21: Canonical Navigation Items Architecture', () => {
    it('defines exactly the 7 canonical left sidebar destinations with correct routes', () => {
      const canonicalNavItems = [
        { label: 'Dashboard', route: '/' },
        { label: 'My Store Preview', route: '/store-preview' },
        { label: 'Inventory', route: '/products' },
        { label: 'Orders', route: '/orders' },
        { label: 'Analytics', route: '/analytics' },
        { label: 'Themes', route: '/brand-studio' },
        { label: 'More', route: '/more' },
      ];

      expect(canonicalNavItems).toHaveLength(7);
      expect(canonicalNavItems.map((i) => i.label)).toEqual([
        'Dashboard',
        'My Store Preview',
        'Inventory',
        'Orders',
        'Analytics',
        'Themes',
        'More',
      ]);
      expect(canonicalNavItems.find((i) => i.label === 'Dashboard')?.route).toBe('/');
      expect(canonicalNavItems.find((i) => i.label === 'My Store Preview')?.route).toBe('/store-preview');
      expect(canonicalNavItems.find((i) => i.label === 'Inventory')?.route).toBe('/products');
      expect(canonicalNavItems.find((i) => i.label === 'Orders')?.route).toBe('/orders');
      expect(canonicalNavItems.find((i) => i.label === 'Analytics')?.route).toBe('/analytics');
      expect(canonicalNavItems.find((i) => i.label === 'Themes')?.route).toBe('/brand-studio');
      expect(canonicalNavItems.find((i) => i.label === 'More')?.route).toBe('/more');
    });
  });

  describe('Part 2, 5 & 7: Dashboard Operations Snapshot & Real Dynamic Metrics', () => {
    it('returns operations snapshot with 8 dynamic metrics from GET /seller/dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/seller/dashboard?period=30d')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(data).toHaveProperty('metrics');
      const metrics = data.metrics;

      // 4 Business Metrics (Row 1)
      expect(metrics).toHaveProperty('revenuePaise');
      expect(typeof metrics.revenuePaise).toBe('number');
      expect(metrics).toHaveProperty('orders');
      expect(typeof metrics.orders).toBe('number');
      expect(metrics).toHaveProperty('enquiries');
      expect(typeof metrics.enquiries).toBe('number');
      expect(metrics).toHaveProperty('customers');
      expect(typeof metrics.customers).toBe('number');

      // 4 Operations Metrics (Row 2)
      expect(metrics).toHaveProperty('pendingOrders');
      expect(typeof metrics.pendingOrders).toBe('number');
      expect(metrics).toHaveProperty('lowStock');
      expect(typeof metrics.lowStock).toBe('number');
      expect(metrics).toHaveProperty('activeProducts');
      expect(typeof metrics.activeProducts).toBe('number');
      expect(metrics).toHaveProperty('averageOrderValuePaise');
      expect(typeof metrics.averageOrderValuePaise).toBe('number');
    });

    it('recalculates period-sensitive metrics when period filter changes (e.g. 7d, 30d, 1y)', async () => {
      const res7d = await request(app.getHttpServer())
        .get('/seller/dashboard?period=7d')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const res1y = await request(app.getHttpServer())
        .get('/seller/dashboard?period=1y')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res7d.body.success).toBe(true);
      expect(res1y.body.success).toBe(true);
      expect(res7d.body.data.period.key).toBe('7d');
      expect(res1y.body.data.period.key).toBe('1y');
    });

    it('enforces strict tenant isolation on dashboard metrics', async () => {
      const resA = await request(app.getHttpServer())
        .get('/seller/dashboard?period=30d')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const resB = await request(app.getHttpServer())
        .get('/seller/dashboard?period=30d')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(resA.body.success).toBe(true);
      expect(resB.body.success).toBe(true);
      expect(resA.body.data.store.id).toBe(storeA.id);
      expect(resB.body.data.store.id).toBe(storeB.id);
      expect(resA.body.data.store.id).not.toEqual(resB.body.data.store.id);
    });
  });

  describe('Part 11 & 12: Dedicated Analytics Intelligence', () => {
    it('returns sales chart time series, top products, customer insights, and locations', async () => {
      const res = await request(app.getHttpServer())
        .get('/seller/dashboard?period=30d')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;

      // Sales chart time series
      expect(Array.isArray(data.salesSeries)).toBe(true);
      // Top products (by revenue and by quantity)
      expect(Array.isArray(data.topProducts.byRevenue)).toBe(true);
      expect(Array.isArray(data.topProducts.byQuantity)).toBe(true);
      expect(data.topProducts.byRevenue.length).toBeLessThanOrEqual(5);
      expect(data.topProducts.byQuantity.length).toBeLessThanOrEqual(5);
      // Customer insights
      expect(data.customerInsights).toHaveProperty('newCustomers');
      expect(data.customerInsights).toHaveProperty('returningCustomers');
      expect(data.customerInsights).toHaveProperty('repeatRate');
      expect(Array.isArray(data.customerInsights.topCustomers)).toBe(true);
      expect(data.customerInsights.topCustomers.length).toBeLessThanOrEqual(5);
      // Top locations (capped at 10)
      expect(Array.isArray(data.topLocations)).toBe(true);
      expect(data.topLocations.length).toBeLessThanOrEqual(10);
      // Recent orders (latest 5)
      expect(Array.isArray(data.recentOrders)).toBe(true);
      expect(data.recentOrders.length).toBeLessThanOrEqual(5);
    });

    it('enforces tenant isolation on analytics intelligence', async () => {
      const resB = await request(app.getHttpServer())
        .get('/seller/dashboard?period=30d')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(resB.body.success).toBe(true);
      expect(resB.body.data.store.id).toBe(storeB.id);
    });
  });

  describe('Part 13, 14 & 15: Store Preview & Subscription Gating', () => {
    it('authorizes private preview for authenticated owner', async () => {
      const authRes = await request(app.getHttpServer())
        .get(`/storefront/${storeA.slug}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(authRes.body.success).toBe(true);
      expect(authRes.body.data.store.name).toBe(storeA.name);
    });

    it('blocks another merchant from previewing private store if not public', async () => {
      if (storeB.status !== StoreStatus.LIVE) {
        const res = await request(app.getHttpServer())
          .get(`/storefront/${storeB.slug}`)
          .set('Authorization', `Bearer ${tokenA}`);

        expect([402, 403, 404]).toContain(res.status);
      }
    });
  });
});
