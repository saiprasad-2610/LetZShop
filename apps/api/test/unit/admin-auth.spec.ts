import { AuthService } from '../../src/modules/auth/auth.service';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';

describe('Platform administrator authentication', () => {
  const password =
    'test-only-random-credential-' + crypto.randomBytes(8).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const admin = {
    id: 'admin-id',
    phone: '+919999999999',
    email: 'admin@example.invalid',
    role: UserRole.PLATFORM_ADMIN,
    isSuperAdmin: true,
    isActive: true,
    deletedAt: null,
    credentials: [
      {
        id: 'credential-id',
        credentialType: 'PIN',
        pinHash:
          salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex'),
        failedPinAttempts: 0,
        lockedUntil: null,
      },
    ],
  };
  let service: AuthService, db: any;
  beforeEach(() => {
    db = {
      user: {
        findFirst: jest.fn().mockResolvedValue(admin),
        update: jest.fn().mockResolvedValue(admin),
      },
      sellerCredential: {
        update: jest.fn().mockResolvedValue({ failedPinAttempts: 1 }),
      },
      platformSetting: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      session: { findUnique: jest.fn() },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    service = new AuthService(
      db,
      {
        verify: () => ({
          sub: admin.id,
          sessionId: 'session',
          role: 'PLATFORM_ADMIN',
          isPlatformAdmin: true,
        }),
      } as any,
      { get: () => undefined } as any,
      {} as any,
    );
    (service as any).createSessionAndIssueTokens = jest
      .fn()
      .mockResolvedValue({
        sessionId: 'session',
        accessToken: 'test-access',
        refreshToken: 'test-refresh',
      });
  });
  it('verifies the stored salted credential instead of comparing fresh hashes', async () => {
    const result = await service.loginAdmin(admin.email, password);
    expect(result.user.isPlatformAdmin).toBe(true);
    expect(db.user.findFirst).toHaveBeenCalledTimes(1);
    expect(db.user.findFirst.mock.calls[0][0].where.OR).toContainEqual({
      email: { equals: admin.email, mode: 'insensitive' },
    });
  });
  it.each(['Admin@ShopOnGo2026!', '123456', 'ShopOnGoAdmin'])(
    'does not accept the former shared bypass %s',
    async (secret) => {
      await expect(service.loginAdmin(admin.email, secret)).rejects.toThrow(
        'Invalid administrator credentials',
      );
      expect(
        (service as any).createSessionAndIssueTokens,
      ).not.toHaveBeenCalled();
    },
  );
  it('does not fall back to a different administrator when the identifier is unknown', async () => {
    db.user.findFirst.mockResolvedValue(null);
    await expect(
      service.loginAdmin('unknown@example.invalid', password),
    ).rejects.toThrow('Invalid administrator credentials');
    expect(db.user.findFirst).toHaveBeenCalledTimes(1);
  });
  it('rejects inactive or locked accounts', async () => {
    db.user.findFirst.mockResolvedValue({ ...admin, isActive: false, isDeactivated: true });
    await expect(service.loginAdmin(admin.email, password)).rejects.toThrow(
      'deactivated',
    );
    db.user.findFirst.mockResolvedValue({
      ...admin,
      credentials: [
        { ...admin.credentials[0], lockedUntil: new Date(Date.now() + 60000) },
      ],
    });
    await expect(service.loginAdmin(admin.email, password)).rejects.toThrow(
      'locked',
    );
  });
  it('uses current database permission after an admin is demoted', async () => {
    db.session.findUnique.mockResolvedValue({
      userId: admin.id,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60000),
      user: { ...admin, role: 'SELLER_OWNER', isSuperAdmin: false },
    });
    const user = await service.validateAccessToken('test-token');
    expect(user.isPlatformAdmin).toBe(false);
    expect(user.role).toBe('SELLER_OWNER');
  });
  it('rejects a revoked session and a deactivated user', async () => {
    db.session.findUnique.mockResolvedValue({
      userId: admin.id,
      isRevoked: true,
      expiresAt: new Date(Date.now() + 60000),
      user: admin,
    });
    await expect(service.validateAccessToken('test-token')).rejects.toThrow(
      'revoked',
    );
    db.session.findUnique.mockResolvedValue({
      userId: admin.id,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60000),
      user: { ...admin, isActive: false },
    });
    await expect(service.validateAccessToken('test-token')).rejects.toThrow(
      'suspended',
    );
  });
});
