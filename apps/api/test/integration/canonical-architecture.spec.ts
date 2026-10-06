import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaClient } from '@prisma/client';
import { SEED_IDS } from '@simply/db';

describe('Canonical Architecture & Seller Auth Reset Suite', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;

  const testPhone = '+919999888877';
  const testPin = '432100';
  let tempToken: string;
  let accessToken: string;
  let refreshToken: string;
  let testTenant: any;
  let testStore: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = moduleFixture.get<PrismaClient>(PrismaClient);

    // Clean up any test user from previous runs
    await prisma.otpChallenge.deleteMany({ where: { phone: testPhone } });
    await prisma.user.deleteMany({ where: { phone: testPhone } });
  });

  afterAll(async () => {
    if (prisma) {
      if (testTenant?.id) {
        await prisma.tenant.deleteMany({ where: { id: testTenant.id } }).catch(() => {});
      }
      await prisma.otpChallenge.deleteMany({ where: { phone: testPhone } });
      await prisma.user.deleteMany({ where: { phone: testPhone } });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  // ============================================================================
  // 1. SELLER AUTH: REGISTRATION OTP -> PIN SETUP -> PIN LOGIN
  // ============================================================================

  describe('1. Seller Canonical Authentication Flow', () => {
    it('A. Request registration OTP creates challenge and succeeds', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register/request-otp')
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.challengeId).toBeDefined();
      expect(res.body.data.expiresInSeconds).toBeGreaterThan(0);
    });

    it('B. Verify registration OTP with mock code "123456" returns ephemeral temp token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register/verify-otp')
        .send({ phone: testPhone, otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tempToken).toBeDefined();
      expect(res.body.data.phone).toBe(testPhone);

      tempToken = res.body.data.tempToken;
    });

    it('C. Setup PIN with valid temp token creates seller account & salted scrypt PIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/pin/setup')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({ pin: testPin });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.phone).toBe(testPhone);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
      testStore = res.body.data.store;
      testTenant = res.body.data.tenant;

      // Verify in DB that PIN is hashed with scrypt and not plaintext
      const cred = await prisma.sellerCredential.findFirst({
        where: { user: { phone: testPhone } },
      });
      expect(cred).toBeDefined();
      expect(cred?.pinHash).toBeDefined();
      expect(cred?.pinHash).not.toBe(testPin);
      expect(cred?.pinHash).toContain(':'); // salt:derivedKey format
    });

    it('D. Login with correct PIN succeeds and returns access + refresh tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/pin/login')
        .send({ phone: testPhone, pin: testPin });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.phone).toBe(testPhone);
    });

    it('E. Login with wrong PIN rejects and increments failed attempts', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/pin/login')
        .send({ phone: testPhone, pin: '999999' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('PIN_INVALID');

      const cred = await prisma.sellerCredential.findFirst({
        where: { user: { phone: testPhone } },
      });
      expect(cred?.failedPinAttempts).toBeGreaterThan(0);
    });

    it('F. Refresh session rotates tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/session/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('G. Logout revokes the session', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('H. OTP recovery flow requests and verifies challenge', async () => {
      const reqRes = await request(app.getHttpServer())
        .post('/auth/recovery/request-otp')
        .send({ phone: testPhone });

      expect(reqRes.status).toBe(200);

      const verRes = await request(app.getHttpServer())
        .post('/auth/recovery/verify-otp')
        .send({ phone: testPhone, otp: '123456' });

      expect(verRes.status).toBe(200);
      expect(verRes.body.data.tempToken).toBeDefined();
    });

    it('I. Login after logout creates active session for seller management', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/pin/login')
        .send({ phone: testPhone, pin: testPin });

      expect(res.status).toBe(200);
      accessToken = res.body.data.accessToken;
    });

    it('J. Merchant completes onboarding to create tenant and store in private preview', async () => {
      const res = await request(app.getHttpServer())
        .post('/stores/onboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessName: 'Sharma Handicrafts',
          category: 'Furniture',
          contactPhone: testPhone,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      testStore = res.body.data.store;
      testTenant = res.body.data.tenant;
      accessToken = res.body.data.accessToken;
    });
  });

  // ============================================================================
  // 2. BUYER UNAUTHENTICATED ACCESS & CANONICAL STOREFRONT APIS
  // ============================================================================

  describe('2. Canonical Public Storefront & Buyer Flow', () => {
    it('A. Public buyer accesses live store without any authorization header', async () => {
      const res = await request(app.getHttpServer())
        .get('/storefront/aaraa-jewels');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.store.name).toBe('Aaraa Fine Jewels');
    });

    it('B. Public buyer lists categories for store', async () => {
      const res = await request(app.getHttpServer())
        .get('/storefront/aaraa-jewels/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.categories)).toBe(true);
    });

    it('C. Public buyer lists products with variants and options', async () => {
      const res = await request(app.getHttpServer())
        .get('/storefront/aaraa-jewels/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
    });

    it('D. Guest cart initialization, item addition and retrieval', async () => {
      // Init cart
      const initRes = await request(app.getHttpServer())
        .post('/storefront/aaraa-jewels/cart')
        .send({});

      expect(initRes.status).toBe(201);
      const cartId = initRes.body.data.id;
      expect(cartId).toBeDefined();

      // Retrieve cart
      const getRes = await request(app.getHttpServer())
        .get(`/storefront/aaraa-jewels/cart/${cartId}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.cart.id).toBe(cartId);
    });

    it('E. Order tracking requires cryptographic token (fails closed without token)', async () => {
      const res = await request(app.getHttpServer())
        .get('/storefront/aaraa-jewels/orders/ORD-0001/track');

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('Tracking token is required');
    });
  });

  // ============================================================================
  // 3. API ERROR CONTRACT
  // ============================================================================

  describe('3. Standard API Error Envelope Contract', () => {
    it('Non-existent store returns STORE_NOT_FOUND code and structured error body', async () => {
      const res = await request(app.getHttpServer())
        .get('/storefront/non-existent-store-slug-999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('STORE_NOT_FOUND');
      expect(typeof res.body.error.message).toBe('string');
      expect(res.body.error.requestId).toBeDefined();
    });

    it('Invalid phone number during registration returns VALIDATION_FAILED with field details', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register/request-otp')
        .send({ phone: '123' }); // Invalid format

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
      expect(res.body.error.details).toBeDefined();
    });
  });

  // ============================================================================
  // 4. FINAL 7 THEMES & BACKEND CAPABILITIES VERIFICATION
  // ============================================================================

  describe('4. Final 7 Product Themes & Capabilities', () => {
    it('DB and Seller API exposes all 7 canonical themes with complete capabilities', async () => {
      const res = await request(app.getHttpServer())
        .get('/seller/themes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      const themes = res.body.data || res.body;
      const themeList = Array.isArray(themes) ? themes : themes.themes;
      expect(themeList.length).toBeGreaterThanOrEqual(7);

      const expectedKeys = ['ATELIER', 'PULSE', 'HARVEST', 'FOUNDRY', 'HABITAT', 'LOCAL', 'FEAST'];
      const themeDefs = await prisma.themeDefinition.findMany();
      const keys = themeDefs.map((t) => t.key);

      for (const expected of expectedKeys) {
        expect(keys).toContain(expected);
      }

      // Check common capabilities on all 7 theme definitions
      for (const td of themeDefs) {
        const caps = td.capabilities as { common: string[]; specialized: string[] };
        expect(Array.isArray(caps.common)).toBe(true);
        expect(caps.common).toContain('logo');
        expect(caps.common).toContain('brandColors');
        expect(caps.common).toContain('typographyPreset');
        expect(caps.common).toContain('heroMode');
        expect(caps.common).toContain('sectionVisibility');
        expect(caps.common).toContain('sectionOrdering');
      }

      // Check specialized capabilities
      const foundry = themeDefs.find((t) => t.key === 'FOUNDRY');
      const foundryCaps = (foundry?.capabilities as any)?.specialized || [];
      expect(foundryCaps).toContain('technicalSpecifications');
      expect(foundryCaps).toContain('rfqEnquiry');
      expect(foundryCaps).toContain('productDocumentsDownloads');

      const feast = themeDefs.find((t) => t.key === 'FEAST');
      const feastCaps = (feast?.capabilities as any)?.specialized || [];
      expect(feastCaps).toContain('foodFirstMenuNavigation');
      expect(feastCaps).toContain('quickAddQuantityControls');
      expect(feastCaps).toContain('storeTimings');

      const habitat = themeDefs.find((t) => t.key === 'HABITAT');
      const habitatCaps = (habitat?.capabilities as any)?.specialized || [];
      expect(habitatCaps).toContain('shopBySpaceUse');
      expect(habitatCaps).toContain('materialFinishPresentation');
    });
  });

  // ============================================================================
  // 5. GENERIC PRODUCT ATTRIBUTES & DOCUMENTS VERIFICATION
  // ============================================================================

  describe('5. Generic Product Attributes & Documents', () => {
    let createdProductId: string;

    it('A. Seller creates product with generic attributes (Material, Pressure, Shelf Life, Fabric)', async () => {
      const res = await request(app.getHttpServer())
        .post('/seller/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Precision Industrial Valve SS316',
          slug: 'precision-industrial-valve-ss316',
          description: 'High pressure stainless steel valve for process engineering',
          mode: 'SELL_AND_ENQUIRY',
          attributes: [
            { name: 'Material', value: 'SS316', type: 'TEXT', sortOrder: 0 },
            { name: 'Pressure', value: 'PN40', type: 'TEXT', sortOrder: 1 },
            { name: 'Fabric', value: 'Linen', type: 'TEXT', sortOrder: 2 },
            { name: 'Shelf Life', value: '7 Days', type: 'TEXT', sortOrder: 3 },
          ],
          options: [
            {
              name: 'Port Size',
              values: [
                { value: '1/2 Inch', sortOrder: 0 },
                { value: '1 Inch', sortOrder: 1 },
              ],
            },
          ],
          variants: [
            {
              sku: 'VALVE-SS316-05',
              pricePaise: 450000,
              initialStock: 25,
              optionValues: ['1/2 Inch'],
            },
            {
              sku: 'VALVE-SS316-10',
              pricePaise: 750000,
              initialStock: 15,
              optionValues: ['1 Inch'],
            },
          ],
        });

      expect(res.status).toBe(201);
      createdProductId = res.body.data.id;
      expect(createdProductId).toBeDefined();

      // Verify product by ID returns attributes
      const getRes = await request(app.getHttpServer())
        .get(`/seller/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.attributes).toBeDefined();
      expect(getRes.body.data.attributes.length).toBe(4);
      expect(getRes.body.data.attributes[0].name).toBe('Material');
      expect(getRes.body.data.attributes[0].value).toBe('SS316');
      expect(getRes.body.data.attributes[1].name).toBe('Pressure');
      expect(getRes.body.data.attributes[1].value).toBe('PN40');
    });

    it('B. Seller attaches and removes product documents (Datasheet, Brochure, Certificate)', async () => {
      const docRes = await request(app.getHttpServer())
        .post(`/seller/products/${createdProductId}/documents`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Technical Specification Datasheet',
          docType: 'DATASHEET',
          fileUrl: 'https://cdn.simplyecommerce.in/docs/valve-ss316-spec.pdf',
          fileSizeMb: 1.45,
          sortOrder: 0,
        });

      expect(docRes.status).toBe(201);
      const docId = docRes.body.data.id;
      expect(docId).toBeDefined();
      expect(docRes.body.data.title).toBe('Technical Specification Datasheet');
      expect(docRes.body.data.docType).toBe('DATASHEET');

      // Verify product includes documents
      const prodRes = await request(app.getHttpServer())
        .get(`/seller/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(prodRes.body.data.documents.length).toBe(1);
      expect(prodRes.body.data.documents[0].id).toBe(docId);

      // Remove document
      const delDocRes = await request(app.getHttpServer())
        .delete(`/seller/products/${createdProductId}/documents/${docId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(delDocRes.status).toBe(200);

      // Verify document removed
      const prodResAfter = await request(app.getHttpServer())
        .get(`/seller/products/${createdProductId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(prodResAfter.body.data.documents.length).toBe(0);
    });
  });

  // ============================================================================
  // 6. BUSINESS HOURS & FULFILLMENT MODES VERIFICATION
  // ============================================================================

  describe('6. Store Business Hours & Physical Information', () => {
    it('A. Seller updates store contact info, address, and fulfillment mode', async () => {
      const res = await request(app.getHttpServer())
        .patch('/seller/store')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          supportPhone: '+919876543210',
          supportEmail: 'care@testbrand.in',
          whatsappNumber: '+919876543210',
          businessAddress: 'Plot 42, Industrial Area Phase 2, Pune, MH 411028',
          mapsUrl: 'https://maps.google.com/?q=Pune+Industrial',
          fulfillmentMode: 'DELIVERY_AND_PICKUP',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.supportPhone).toBe('+919876543210');
      expect(res.body.data.fulfillmentMode).toBe('DELIVERY_AND_PICKUP');
      expect(res.body.data.businessAddress).toContain('Pune');
    });

    it('B. Seller manages weekly store business hours', async () => {
      const hoursData = [
        { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00', isClosed: false },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '20:00', isClosed: false },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '20:00', isClosed: false },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00', isClosed: false },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '20:00', isClosed: false },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '18:00', isClosed: false },
        { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true },
      ];

      const putRes = await request(app.getHttpServer())
        .put('/seller/store/business-hours')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ hours: hoursData });

      expect(putRes.status).toBe(200);
      expect(putRes.body.data.length).toBe(7);

      const getRes = await request(app.getHttpServer())
        .get('/seller/store/business-hours')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBe(7);
      const sunday = getRes.body.data.find((h: any) => h.dayOfWeek === 0);
      expect(sunday?.isClosed).toBe(true);
    });
  });

  // ============================================================================
  // 7. SUBSCRIPTION GATING CORRECTION VERIFICATION
  // ============================================================================

  describe('7. Subscription Gating Correction (No Unpaid Public Storefront)', () => {
    it('A. Unpaid seller CAN manage dashboard, store settings, and products', async () => {
      const dashRes = await request(app.getHttpServer())
        .get('/seller/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(dashRes.status).toBe(200);

      const storeRes = await request(app.getHttpServer())
        .get('/seller/store')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(storeRes.status).toBe(200);
      expect(storeRes.body.data.id).toBe(testStore.id);
    });

    it('B. Unpaid seller CANNOT publish store publicly (rejects with SUBSCRIPTION_REQUIRED)', async () => {
      const pubRes = await request(app.getHttpServer())
        .post('/seller/store/publish')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(pubRes.status).toBe(402);
      expect(pubRes.body.error).toBeDefined();
      expect(pubRes.body.error.code).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('C. Public buyer CANNOT access un-published / unpaid store publicly', async () => {
      const sfRes = await request(app.getHttpServer())
        .get(`/storefront/${testStore.slug}`);

      expect(sfRes.status).toBe(402);
      expect(sfRes.body.error.code).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('D. Seller CAN preview store in private mode', async () => {
      const previewRes = await request(app.getHttpServer())
        .get(`/storefront/${testStore.slug}?preview=true`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.data.store.id).toBe(testStore.id);
      expect(previewRes.body.data.isPreview).toBe(true);
    });

    it('E. Public buyer CANNOT checkout on un-published / unpaid store', async () => {
      const coRes = await request(app.getHttpServer())
        .post(`/storefront/${testStore.slug}/checkout`)
        .send({
          storeId: testStore.id,
          cartId: 'c1000000-0000-0000-0000-000000000001',
          fullName: 'Buyer Test',
          phone: '+919999111122',
          deliveryAddress: {
            addressLine1: 'Road 1',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
          },
        });

      expect(coRes.status).toBe(402);
      expect(coRes.body.error.code).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('F. Once active subscription is provisioned, seller CAN publish and public buyer CAN access store', async () => {
      // Provision active subscription
      await prisma.subscription.create({
        data: {
          tenantId: testTenant.id,
          planId: SEED_IDS.starterPlan,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Seller publishes store
      const pubRes = await request(app.getHttpServer())
        .post('/seller/store/publish')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(pubRes.status).toBe(201);
      expect(pubRes.body.data.status).toBe('LIVE');
      expect(pubRes.body.data.isPubliclyAccessible).toBe(true);

      // Public buyer can now visit store
      const sfRes = await request(app.getHttpServer())
        .get(`/storefront/${testStore.slug}`);

      expect(sfRes.status).toBe(200);
      expect(sfRes.body.data.store.id).toBe(testStore.id);
      expect(sfRes.body.data.store.status).toBe('LIVE');
    });
  });
});
