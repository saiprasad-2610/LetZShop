import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, OtpPurpose } from '@prisma/client';
import { SEED_IDS } from '@simply/db';
import request from 'supertest';
import * as crypto from 'crypto';
import { AppModule } from '../../src/app.module';

describe('Merchant JWT and session security', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaClient;
  let jwt: JwtService;
  let userId: string;
  const phone = '+919999881234';
  const pin = '615243';
  const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

  const login = async () => {
    const res = await request(app.getHttpServer()).post('/auth/pin/login').send({ phone, pin });
    expect(res.status).toBe(200);
    return res.body.data;
  };
  const dashboard = (token?: string) => {
    const req = request(app.getHttpServer()).get('/seller/dashboard');
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };
  const refresh = (token: string) => request(app.getHttpServer())
    .post('/auth/session/refresh').send({ refreshToken: token });

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = module.get(PrismaClient);
    jwt = module.get(JwtService);
    await prisma.user.deleteMany({ where: { phone } });
    const salt = crypto.randomBytes(16).toString('hex');
    const user = await prisma.user.create({
      data: {
        phone, fullName: 'Session Security Test',
        credentials: { create: { credentialType: 'PIN', pinHash: `${salt}:${crypto.scryptSync(pin, salt, 64).toString('hex')}` } },
        memberships: { create: { tenantId: SEED_IDS.tenantA, role: 'SELLER_OWNER', isActive: true } },
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.otpChallenge.deleteMany({ where: { phone } });
      await prisma.otpRequest.deleteMany({ where: { phone } });
      await prisma.user.deleteMany({ where: { phone } });
    }
    if (app) await app.close();
  });

  it('rejects protected requests without JWT', async () => {
    expect((await dashboard()).status).toBe(401);
  });

  it('validates JWT signature and expiry independently of the frontend', async () => {
    const data = await login();
    const payload: any = jwt.decode(data.accessToken);
    const { iat, exp, ...claims } = payload;
    expect(exp - iat).toBe(900);
    expect((await dashboard(data.accessToken)).status).toBe(200);
    const parts = data.accessToken.split('.');
    const tampered = `${parts[0]}.${Buffer.from(JSON.stringify({ ...payload, tenantId: SEED_IDS.tenantB })).toString('base64url')}.${parts[2]}`;
    for (const token of ['invalid', tampered, jwt.sign(claims, { secret: 'wrong-test-secret' }), jwt.sign(claims, { expiresIn: -1 })]) {
      expect((await dashboard(token)).status).toBe(401);
    }
  });

  it('rejects expired refresh tokens and expired underlying sessions', async () => {
    const first = await login();
    await prisma.refreshToken.update({ where: { tokenHash: hash(first.refreshToken) }, data: { expiresAt: new Date(0) } });
    expect((await refresh(first.refreshToken)).status).toBe(401);
    const second = await login();
    await prisma.session.update({ where: { id: second.user.sessionId }, data: { expiresAt: new Date(0) } });
    expect((await refresh(second.refreshToken)).status).toBe(401);
    expect((await dashboard(second.accessToken)).status).toBe(401);
  });

  it('allows only one winner when the same refresh token is submitted concurrently', async () => {
    const data = await login();
    const responses = await Promise.all([refresh(data.refreshToken), refresh(data.refreshToken)]);
    expect(responses.map(res => res.status).sort()).toEqual([200, 401]);
    const winner = responses.find(res => res.status === 200)!;
    expect((await dashboard(winner.body.data.accessToken)).status).toBe(200);
    expect((await refresh(data.refreshToken)).status).toBe(401);
    const session = await prisma.session.findUniqueOrThrow({ where: { id: data.user.sessionId } });
    const next = await prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: hash(winner.body.data.refreshToken) } });
    expect(next.expiresAt).toEqual(session.expiresAt);
  });

  it('logout revokes access and refresh and cannot be undone by using the old JWT for PIN setup', async () => {
    const data = await login();
    expect((await request(app.getHttpServer()).post('/auth/logout').set('Authorization', `Bearer ${data.accessToken}`)).status).toBe(200);
    expect((await dashboard(data.accessToken)).status).toBe(401);
    expect((await refresh(data.refreshToken)).status).toBe(401);
    expect((await request(app.getHttpServer()).post('/auth/pin/setup').send({ verificationToken: data.accessToken, pin })).status).toBe(401);
  });

  it('rejects a signed JWT whose subject does not own its server session', async () => {
    const data = await login();
    const payload: any = jwt.decode(data.accessToken);
    const { iat, exp, ...claims } = payload;
    expect((await dashboard(jwt.sign({ ...claims, sub: SEED_IDS.tenantBOwner }))).status).toBe(401);
  });

  it('rechecks active merchant membership for existing access and refresh tokens', async () => {
    const data = await login();
    try {
      await prisma.tenantMembership.updateMany({ where: { userId }, data: { isActive: false } });
      expect((await dashboard(data.accessToken)).status).toBe(401);
      expect((await refresh(data.refreshToken)).status).toBe(401);
    } finally {
      await prisma.tenantMembership.updateMany({ where: { userId }, data: { isActive: true } });
    }
  });

  it('rejects inactive accounts at PIN login, access validation, and refresh', async () => {
    const data = await login();
    try {
      await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
      expect((await request(app.getHttpServer()).post('/auth/pin/login').send({ phone, pin })).status).toBe(401);
      expect((await dashboard(data.accessToken)).status).toBe(401);
      expect((await refresh(data.refreshToken)).status).toBe(401);
    } finally {
      await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
    }
  });

  it('cannot switch to a foreign tenant/store using query parameters or signed incompatible store context', async () => {
    const data = await login();
    const res = await request(app.getHttpServer()).get(`/stores/my-store?tenantId=${SEED_IDS.tenantB}&storeId=${SEED_IDS.storeB}`)
      .set('Authorization', `Bearer ${data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(SEED_IDS.storeA);
    const { iat, exp, ...claims }: any = jwt.decode(data.accessToken);
    expect((await dashboard(jwt.sign({ ...claims, storeId: SEED_IDS.storeB }))).status).toBe(401);
  });

  it('accepts a verified recovery grant once and rejects subsequent PIN-reset replay', async () => {
    const challenge = await prisma.otpChallenge.create({ data: {
      phone, purpose: OtpPurpose.RECOVERY, codeHash: hash('123456'),
      isVerified: true, verifiedAt: new Date(), expiresAt: new Date(Date.now() + 300000),
    } });
    const verificationToken = jwt.sign({ phone, challengeId: challenge.id, purpose: OtpPurpose.RECOVERY }, { expiresIn: '15m' });
    const setup = () => request(app.getHttpServer()).post('/auth/pin/setup').send({ verificationToken, pin });
    expect((await setup()).status).toBe(201);
    expect((await setup()).status).toBe(401);
  });
});
