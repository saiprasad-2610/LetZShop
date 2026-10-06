import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaClient, StoreStatus, UserRole } from '@prisma/client';
import { GlobalHttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '../../src/common/interceptors/response-transform.interceptor';

describe('Merchant Flow 01 — Authentication & Initial Store Onboarding', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;

  const testPhone = '+919876599901';
  const testPin = '849261';
  const testPinNew = '135790';
  let tempToken: string;
  let accessToken: string;
  let refreshToken: string;
  let storeAccessToken: string;
  let createdStoreId: string;
  let createdTenantId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    // Clean up test phone prior to run
    const existingUser = await prisma.user.findUnique({
      where: { phone: testPhone },
      include: {
        memberships: true,
      },
    });

    if (existingUser) {
      for (const m of existingUser.memberships) {
        await prisma.tenant.deleteMany({ where: { id: m.tenantId } }).catch(() => {});
      }
      await prisma.user.deleteMany({ where: { phone: testPhone } }).catch(() => {});
    }
    await prisma.otpChallenge.deleteMany({ where: { phone: testPhone } });

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
  });

  afterAll(async () => {
    if (createdTenantId) {
      await prisma.tenant.deleteMany({ where: { id: createdTenantId } }).catch(() => {});
    }
    await prisma.otpChallenge.deleteMany({ where: { phone: testPhone } }).catch(() => {});
    await prisma.user.deleteMany({ where: { phone: testPhone } }).catch(() => {});
    await prisma.$disconnect();
    if (app) {
      await app.close();
    }
  });

  // ============================================================================
  // 1. REGISTRATION OTP
  // ============================================================================

  it('1.1 Should reject OTP request with invalid Indian phone format', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/request-otp')
      .send({ phone: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('1.2 Should successfully create registration OTP challenge for valid Indian mobile', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/request-otp')
      .send({ phone: testPhone });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challengeId).toBeDefined();
    expect(res.body.data.expiresInSeconds).toBeGreaterThan(0);
  });

  it('1.3 Should reject OTP verification with incorrect code', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/verify-otp')
      .send({ phone: testPhone, otp: '999999' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Invalid OTP');
  });

  it('1.4 Should successfully verify registration OTP with dev code 123456 and return verificationToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/verify-otp')
      .send({ phone: testPhone, otp: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tempToken).toBeDefined();
    expect(res.body.data.verificationToken).toBeDefined();
    expect(res.body.data.phone).toBe(testPhone);

    tempToken = res.body.data.tempToken;
  });

  // ============================================================================
  // 2. PIN SETUP & INITIAL AUTHENTICATED STATE
  // ============================================================================

  it('2.0a PIN setup rejects 4-digit PIN with 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/pin/setup')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({ pin: '1234' });

    expect(res.status).toBe(400);
  });

  it('2.0b PIN setup rejects 5-digit PIN with 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/pin/setup')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({ pin: '12345' });

    expect(res.status).toBe(400);
  });

  it('2.0c PIN setup rejects letters or symbols in PIN with 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/pin/setup')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({ pin: '1234ab' });

    expect(res.status).toBe(400);
  });

  it('2.1 Should set up security PIN and issue session with ONBOARDING_REQUIRED state (store is null)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/pin/setup')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({ pin: testPin });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.phone).toBe(testPhone);

    // Initial merchant state MUST be ONBOARDING_REQUIRED (no pre-seeded dummy store)
    expect(res.body.data.store).toBeNull();
    expect(res.body.data.user.storeId).toBeNull();
    expect(res.body.data.user.tenantId).toBeNull();

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;

    // Verify PIN is hashed with salted scrypt
    const cred = await prisma.sellerCredential.findFirst({
      where: { user: { phone: testPhone } },
    });
    expect(cred).toBeDefined();
    expect(cred?.pinHash).not.toBe(testPin);
    expect(cred?.pinHash).toContain(':');
  });

  // ============================================================================
  // 3. STORE CREATION & ONBOARDING VALIDATION
  // ============================================================================

  it('3.1 Unauthenticated POST /stores/onboard must be rejected with 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer())
      .post('/stores/onboard')
      .send({
        businessName: 'Royal Silk Emporium',
        category: 'Fashion',
        contactPhone: testPhone,
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Authentication token missing');
  });

  it('3.2 Onboarding validation failure: Missing businessName returns specific field message', async () => {
    const res = await request(app.getHttpServer())
      .post('/stores/onboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        category: 'Fashion',
        contactPhone: testPhone,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Business name is required');
  });

  it('3.2b Onboarding validation failure: Malformed email returns 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/stores/onboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        businessName: 'Royal Silk Emporium',
        category: 'Fashion',
        contactPhone: testPhone,
        contactEmail: 'not-an-email',
      });

    expect(res.status).toBe(400);
  });

  it('3.3 Onboarding validation failure: Invalid phone format returns specific field message', async () => {
    const res = await request(app.getHttpServer())
      .post('/stores/onboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        businessName: 'Royal Silk Emporium',
        category: 'Fashion',
        contactPhone: 'invalid-phone-format',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Phone number must use +91XXXXXXXXXX format');
  });

  it('3.4 Authenticated merchant completes onboarding in single transaction', async () => {
    const res = await request(app.getHttpServer())
      .post('/stores/onboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        businessName: 'Royal Silk Emporium',
        category: 'Fashion',
        contactPhone: testPhone,
        contactEmail: 'contact@royalsilk.com',
        address: 'Surat, Gujarat',
        city: 'Surat',
        state: 'Gujarat',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.store).toBeDefined();
    expect(data.store.name).toBe('Royal Silk Emporium');
    expect(data.store.status).toBe(StoreStatus.PRIVATE_PREVIEW);
    expect(data.store.supportPhone).toBe(testPhone);
    expect(data.store.supportEmail).toBe('contact@royalsilk.com');
    expect(data.store.businessAddress).toBe('Surat, Gujarat');

    expect(data.tenant).toBeDefined();
    expect(data.tenant.name).toBe('Royal Silk Emporium');

    // Refreshed token containing store and tenant identity
    expect(data.accessToken).toBeDefined();
    expect(data.user.storeId).toBe(data.store.id);
    expect(data.user.tenantId).toBe(data.tenant.id);

    storeAccessToken = data.accessToken;
    createdStoreId = data.store.id;
    createdTenantId = data.tenant.id;

    // Verify tenant membership in DB
    const membership = await prisma.tenantMembership.findFirst({
      where: { tenantId: createdTenantId, userId: data.user.userId },
    });
    expect(membership).toBeDefined();
    expect(membership?.role).toBe(UserRole.SELLER_OWNER);
  });

  it('3.5 Duplicate onboarding call is prevented and returns existing store cleanly', async () => {
    const res = await request(app.getHttpServer())
      .post('/stores/onboard')
      .set('Authorization', `Bearer ${storeAccessToken}`)
      .send({
        businessName: 'Royal Silk Emporium Duplicate',
        category: 'Fashion',
        contactPhone: testPhone,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.store.id).toBe(createdStoreId);
    expect(res.body.data.tenant.id).toBe(createdTenantId);
  });

  // ============================================================================
  // 4. RETURNING MERCHANT LOGIN (PHONE + PIN)
  // ============================================================================

  it('4.0 Reject 4-digit PIN in login with 400 Bad Request', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/pin/login')
      .send({ phone: testPhone, pin: '1234' });

    expect(res.status).toBe(400);
  });

  it('4.1 Incorrect 6-digit PIN rejects and returns remaining attempt count', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/pin/login')
      .send({ phone: testPhone, pin: '000000' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('PIN_INVALID');
    expect(res.body.error.message).toContain('Incorrect PIN');
  });

  it('4.2 Returning merchant logs in with correct PIN and reaches ACTIVE_SELLER state', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/pin/login')
      .send({ phone: testPhone, pin: testPin });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.store).toBeDefined();
    expect(res.body.data.store.id).toBe(createdStoreId);
    expect(res.body.data.user.storeId).toBe(createdStoreId);

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  // ============================================================================
  // 5. SESSION REFRESH & PERSISTENCE
  // ============================================================================

  it('5.1 Refresh session rotates refresh token and issues new access token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/session/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken);

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('5.2 Merchant accesses protected my-store route using active session', async () => {
    const res = await request(app.getHttpServer())
      .get('/stores/my-store')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdStoreId);
    expect(res.body.data.name).toBe('Royal Silk Emporium');
  });

  // ============================================================================
  // 6. ACCOUNT RECOVERY (FORGOT PIN)
  // ============================================================================

  it('6.1 Recovery OTP challenge request succeeds', async () => {
    // Delete recent challenges to clear 60s cooldown for test speed
    await prisma.otpChallenge.deleteMany({ where: { phone: testPhone } });

    const res = await request(app.getHttpServer())
      .post('/auth/recovery/request-otp')
      .send({ phone: testPhone });

    expect(res.status).toBe(200);
    expect(res.body.data.challengeId).toBeDefined();
  });

  it('6.2 Verify recovery OTP returns tempToken for PIN reset', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/recovery/verify-otp')
      .send({ phone: testPhone, otp: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.data.tempToken).toBeDefined();
    tempToken = res.body.data.tempToken;
  });

  it('6.3 Reset PIN updates credential and logs merchant in directly', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/pin/setup')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({ pin: testPinNew });

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.store).toBeDefined();
    expect(res.body.data.store.id).toBe(createdStoreId);

    // Verify login with new PIN works
    const loginRes = await request(app.getHttpServer())
      .post('/auth/pin/login')
      .send({ phone: testPhone, pin: testPinNew });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
    accessToken = loginRes.body.data.accessToken;
  });

  // ============================================================================
  // 7. LOGOUT & SESSION REVOCATION
  // ============================================================================

  it('7.1 Logout revokes active server-side session', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('7.2 Revoked session rejects subsequent requests with 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer())
      .get('/stores/my-store')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('revoked');
  });

  // ============================================================================
  // 8. EXISTING ACCOUNT DETECTION & PARTIAL REGISTRATION
  // ============================================================================

  it('8.1 Existing merchant with PIN is rejected with 409 ACCOUNT_EXISTS on registration', async () => {
    const challengesBefore = await prisma.otpChallenge.count({
      where: { phone: testPhone },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/register/request-otp')
      .send({ phone: testPhone });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ACCOUNT_EXISTS');
    expect(res.body.error.message).toContain('An account already exists with this mobile number. Please log in.');

    // Prove OTP challenge was NOT generated
    const challengesAfter = await prisma.otpChallenge.count({
      where: { phone: testPhone },
    });
    expect(challengesAfter).toBe(challengesBefore);
  });

  it('8.2 Partial registration user without PIN is permitted to request registration OTP', async () => {
    const partialPhone = '+919876599988';
    // Clean up partial test phone if exists
    await prisma.otpChallenge.deleteMany({ where: { phone: partialPhone } });
    await prisma.user.deleteMany({ where: { phone: partialPhone } });

    // Create partial user without any credentials (PIN)
    await prisma.user.create({
      data: {
        phone: partialPhone,
        fullName: 'Partial Merchant',
        role: UserRole.SELLER_OWNER,
      },
    });

    try {
      const res = await request(app.getHttpServer())
        .post('/auth/register/request-otp')
        .send({ phone: partialPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.challengeId).toBeDefined();
    } finally {
      await prisma.otpChallenge.deleteMany({ where: { phone: partialPhone } });
      await prisma.user.deleteMany({ where: { phone: partialPhone } });
    }
  });
});
