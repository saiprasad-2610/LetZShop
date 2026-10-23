import { EmailOtpService } from './email-otp.service';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, UserRole, CredentialType, OtpPurpose, StoreStatus } from '@prisma/client';
import { OtpProvider } from './interfaces/otp-provider.interface';
import { AuthenticatedUser } from '@simply/types';
import { normalizePhone, isValidIndianPhone } from '@simply/validation';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('OTP_PROVIDER') private readonly otpProvider: OtpProvider,
    private readonly emailOtp: EmailOtpService
  ) {
  }

  // ============================================================================
  // CANONICAL SELLER AUTH FLOW (OTP -> PIN SETUP -> PIN LOGIN)
  // ============================================================================

  public async requestOtpChallenge(rawPhone: string, purpose: OtpPurpose = OtpPurpose.REGISTRATION, email?: string) {
    return this.emailOtp.request(rawPhone, purpose, email);
  }

  public async verifyOtpChallenge(rawPhone: string, code: string, purpose: OtpPurpose = OtpPurpose.REGISTRATION, email?: string) {
    const challenge = await this.emailOtp.verify(rawPhone, code.trim(), purpose, email);
    const phone = challenge.phone;
    const existingUser = await this.prisma.user.findUnique({ where: { phone }, include: { credentials: true } });
    if (existingUser && (!existingUser.isActive || existingUser.deletedAt)) throw new ForbiddenException('Account unavailable. Please contact support.');
    const verificationToken = this.jwtService.sign({ phone, email: challenge.email, challengeId: challenge.id, purpose, emailVerified: Boolean(challenge.email) }, { expiresIn: '15m' });
    return { verificationToken, tempToken: verificationToken, isNewUser: !existingUser, phone };
  }

  public async requestLegacyEmail(userId: string, email: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.emailOtp.request(user.phone, OtpPurpose.EMAIL_VERIFICATION, email, user.id);
  }

  public async verifyLegacyEmail(userId: string, email: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.email) throw new BadRequestException('An existing account email cannot be overwritten.');
    const challenge = await this.emailOtp.verify(user.phone, code, OtpPurpose.EMAIL_VERIFICATION, email);
    await this.prisma.$transaction(async tx => {
      const changed = await tx.user.updateMany({ where: { id: user.id, email: null }, data: { email: challenge.email, emailVerifiedAt: new Date() } });
      if (changed.count !== 1) throw new BadRequestException('Account email has already been set.');
      await tx.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
    });
    return { verified: true };
  }

  public async setupPin(
    data: {
      verificationToken: string;
      phone: string;
      pin: string;
      fullName: string;
      email?: string;
    },
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    user: AuthenticatedUser;
    tenant?: any;
    store?: any;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    // 1. Verify verificationToken
    let tokenPayload: any;
    try {
      tokenPayload = this.jwtService.verify(data.verificationToken);
    } catch {
      throw new UnauthorizedException('Verification token has expired or is invalid. Please request a new OTP.');
    }

    const phone = data.phone && data.phone.trim() ? normalizePhone(data.phone) : normalizePhone(tokenPayload.phone);
    if (data.phone && data.phone.trim() && normalizePhone(tokenPayload.phone) !== phone) {
      throw new BadRequestException('Verification token phone does not match request phone.');
    }

    if (!/^\d{6}$/.test(data.pin)) {
      throw new BadRequestException('PIN must be exactly 6 numeric digits.');
    }

    if (![OtpPurpose.REGISTRATION, OtpPurpose.RECOVERY].includes(tokenPayload.purpose) || !tokenPayload.challengeId) throw new UnauthorizedException('Invalid verification token.');
    if (tokenPayload.purpose === OtpPurpose.REGISTRATION && (!tokenPayload.emailVerified || !tokenPayload.email)) throw new UnauthorizedException('Verified email is required.');
    const consumed = await this.prisma.otpChallenge.updateMany({
      where: { id: tokenPayload.challengeId, phone, purpose: tokenPayload.purpose, email: tokenPayload.email || null, isVerified: true, consumedAt: null, verifiedAt: { not: null }, deliveredAt: { not: null } },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) throw new UnauthorizedException('Verification has already been used or is invalid.');

    const pinHash = this.hashPin(data.pin);

    // 2. Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            tenant: {
              include: {
                stores: {
                  take: 1,
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (user && (!user.isActive || user.deletedAt)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact LetzShop Support.',
        },
        HttpStatus.FORBIDDEN
      );
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          fullName: data.fullName || 'Merchant Seller',
          email: tokenPayload.email || null,
          emailVerifiedAt: tokenPayload.email ? new Date() : null,
          role: UserRole.SELLER_OWNER,
        },
        include: {
          memberships: {
            where: { isActive: true },
            include: {
              tenant: {
                include: {
                  stores: {
                    take: 1,
                    orderBy: { createdAt: 'asc' },
                  },
                },
              },
            },
          },
        },
      });
    } else if ((data.fullName && user.fullName === 'Merchant Seller') || tokenPayload.email) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { ...(data.fullName && user.fullName === 'Merchant Seller' ? { fullName: data.fullName } : {}), ...(!user.email && tokenPayload.email ? { email: tokenPayload.email, emailVerifiedAt: new Date() } : {}), ...(user.email?.trim().toLowerCase() === tokenPayload.email ? { emailVerifiedAt: new Date() } : {}) },
      });
    }

    if (!user.email && tokenPayload.email) user.email = tokenPayload.email;

    // 3. Upsert SellerCredential (PIN)
    await this.prisma.sellerCredential.upsert({
      where: {
        userId_credentialType: {
          userId: user.id,
          credentialType: CredentialType.PIN,
        },
      },
      update: {
        pinHash,
        failedPinAttempts: 0,
        lockedUntil: null,
      },
      create: {
        userId: user.id,
        credentialType: CredentialType.PIN,
        pinHash,
        failedPinAttempts: 0,
      },
    });

    // 4. Resolve primary tenant & store if user already has an active business
    const refreshedUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            tenant: {
              include: {
                stores: {
                  where: { deletedAt: null },
                  take: 1,
                  orderBy: { createdAt: 'asc' },
                  include: {
                    branding: true,
                    themeConfigs: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let primaryMembership = refreshedUser?.memberships?.[0];
    let tenant = primaryMembership?.tenant;
    let store = tenant?.stores?.[0];

    // 5. Issue session & tokens (tenant & store remain null until onboarding is completed)
    const tokens = await this.createSessionAndIssueTokens(user, tenant?.id, store?.id, userAgent, ipAddress);

    return {
      user: {
        userId: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role as any,
        tenantId: tenant?.id || null,
        storeId: store?.id || null,
        sessionId: tokens.sessionId,
        isPlatformAdmin: user.isSuperAdmin,
      },
      tenant: tenant || null,
      store: store || null,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900,
      },
    };
  }

  public async loginWithPin(
    rawPhone: string,
    pin: string,
    deviceFingerprint?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    user: AuthenticatedUser;
    tenant?: any;
    store?: any;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    const phone = normalizePhone(rawPhone);
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: {
        credentials: {
          where: { credentialType: CredentialType.PIN },
        },
        memberships: {
          where: { isActive: true },
          include: {
            tenant: {
              include: {
                stores: {
                  take: 1,
                  orderBy: { createdAt: 'asc' },
                  include: {
                    branding: true,
                    themeConfigs: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('No account found for this mobile number. Please register first.');
    }

    if (!user.isActive || user.deletedAt) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact LetzShop Support.',
        },
        HttpStatus.FORBIDDEN
      );
    }

    const pinCredential = user.credentials[0];
    if (!pinCredential || !pinCredential.pinHash) {
      throw new UnauthorizedException('PIN is not configured for this account. Please verify via OTP and set up your PIN.');
    }

    // Check lockout
    if (pinCredential.lockedUntil && pinCredential.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((pinCredential.lockedUntil.getTime() - Date.now()) / 60000);
      throw new HttpException(
        {
          code: 'PIN_LOCKED',
          message: `Account is locked due to too many failed attempts. Try again in ${waitMinutes} minutes or use OTP recovery.`,
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Verify PIN
    const isValid = this.verifyPin(pin, pinCredential.pinHash);
    if (!isValid) {
      const newAttempts = pinCredential.failedPinAttempts + 1;
      const willLock = newAttempts >= 5;
      const lockedUntil = willLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.prisma.sellerCredential.update({
        where: { id: pinCredential.id },
        data: {
          failedPinAttempts: newAttempts,
          lockedUntil,
        },
      });

      if (willLock) {
        throw new HttpException(
          { code: 'PIN_LOCKED', message: 'Too many incorrect PIN attempts. Account locked for 15 minutes.' },
          HttpStatus.FORBIDDEN
        );
      }
      throw new UnauthorizedException({
        code: 'PIN_INVALID',
        message: `Incorrect PIN. ${5 - newAttempts} attempt(s) remaining.`,
      });
    }

    // Reset failed attempts on success
    if (pinCredential.failedPinAttempts > 0) {
      await this.prisma.sellerCredential.update({
        where: { id: pinCredential.id },
        data: { failedPinAttempts: 0, lockedUntil: null },
      });
    }

    // Register / update device if fingerprint is provided
    let deviceId: string | undefined;
    if (deviceFingerprint) {
      const device = await this.prisma.device.upsert({
        where: {
          userId_deviceFingerprint: {
            userId: user.id,
            deviceFingerprint,
          },
        },
        update: {
          lastIp: ipAddress || null,
          lastSeenAt: new Date(),
          userAgent: userAgent || null,
        },
        create: {
          userId: user.id,
          deviceFingerprint,
          userAgent: userAgent || null,
          lastIp: ipAddress || null,
          isTrusted: true,
        },
      });
      deviceId = device.id;
    }

    const primaryMembership = user.memberships[0];
    const tenant = primaryMembership?.tenant;
    const store = tenant?.stores?.[0];

    const tokens = await this.createSessionAndIssueTokens(user, tenant?.id, store?.id, userAgent, ipAddress, deviceId);

    return {
      user: {
        userId: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role as any,
        tenantId: tenant?.id || null,
        storeId: store?.id || null,
        sessionId: tokens.sessionId,
        isPlatformAdmin: user.isSuperAdmin,
      },
      tenant: tenant || null,
      store: store || null,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900,
      },
    };
  }

  public async loginAdmin(
    identifier: string,
    secret: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    user: AuthenticatedUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    const rawId = (identifier || '').trim();
    const cleanEmail = rawId.toLowerCase();
    let normalizedPh = rawId;
    try {
      normalizedPh = rawId.startsWith('+') ? normalizePhone(rawId) : normalizePhone('+91' + rawId.replace(/^0+/, ''));
    } catch {}

    // Find platform admin
    let admin = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: 'insensitive' } },
          { phone: rawId },
          { phone: normalizedPh },
        ],
        AND: [{ OR: [{ role: UserRole.PLATFORM_ADMIN }, { isSuperAdmin: true }] }],
        deletedAt: null,
      },
      include: {
        credentials: true,
      },
    });

    if (!admin) {
      await this.prisma.auditLog.create({
        data: {
          actorType: 'ADMIN',
          action: 'ADMIN_LOGIN_FAILED',
          entityType: 'User',
          entityId: cleanEmail,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          metadata: {
            identifier: rawId,
            reason: 'User not found or not an administrator',
            result: 'FAILED',
            module: 'Authentication',
          },
        },
      });
      throw new UnauthorizedException('Invalid administrator credentials provided.');
    }

    if (!admin.isActive || (admin as any).isDeactivated) {
      await this.prisma.auditLog.create({
        data: {
          actorId: admin.id,
          actorType: 'ADMIN',
          action: 'ADMIN_LOGIN_FAILED',
          entityType: 'User',
          entityId: admin.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          metadata: {
            email: admin.email,
            reason: (admin as any).isDeactivated ? 'Administrator account deactivated' : 'Administrator account suspended',
            result: 'DENIED',
            module: 'Authentication',
          },
        },
      });
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          code: (admin as any).isDeactivated ? 'ACCOUNT_DEACTIVATED' : 'ACCOUNT_SUSPENDED',
          message: (admin as any).isDeactivated
            ? 'Administrator account has been permanently deactivated.'
            : 'Administrator account has been suspended.',
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Verify secret
    const pinCred = admin.credentials?.find((c) => c.credentialType === CredentialType.PIN);
    if (pinCred?.lockedUntil && pinCred.lockedUntil > new Date()) {
      throw new UnauthorizedException('Administrator login temporarily locked. Try again later.');
    }
    const isValid = Boolean(pinCred?.pinHash && this.verifyPin(secret, pinCred.pinHash));

    if (!isValid) {
      if (pinCred) {
        const securitySetting = await this.prisma.platformSetting.findUnique({
          where: { key: 'security' },
        });
        const maxAttempts = Number((securitySetting?.value as any)?.maxFailedLoginAttempts ?? 5);
        const failed = await this.prisma.sellerCredential.update({ where: { id: pinCred.id }, data: { failedPinAttempts: { increment: 1 } } });
        if (failed.failedPinAttempts >= maxAttempts) await this.prisma.sellerCredential.update({ where: { id: pinCred.id }, data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } });
      }
      await this.prisma.auditLog.create({
        data: {
          actorId: admin.id,
          actorType: 'ADMIN',
          action: 'ADMIN_LOGIN_FAILED',
          entityType: 'User',
          entityId: admin.id,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          metadata: {
            email: admin.email,
            reason: 'Incorrect password',
            result: 'FAILED',
            module: 'Authentication',
          },
        },
      });
      throw new UnauthorizedException('Invalid administrator credentials provided.');
    }
    await this.prisma.sellerCredential.update({ where: { id: pinCred!.id }, data: { failedPinAttempts: 0, lockedUntil: null } });

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() } as any,
    });

    const tokens = await this.createSessionAndIssueTokens(admin, undefined, undefined, userAgent, ipAddress);

    await this.prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorType: 'ADMIN',
        action: 'ADMIN_LOGIN',
        entityType: 'User',
        entityId: admin.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: {
          email: admin.email,
          fullName: admin.fullName,
          role: admin.isSuperAdmin ? 'SUPER_ADMIN' : 'SUB_ADMIN',
          result: 'SUCCESS',
          module: 'Authentication',
        },
      },
    });

    return {
      user: {
        userId: admin.id,
        phone: admin.phone,
        email: admin.email,
        fullName: admin.fullName || undefined,
        role: admin.role as any,
        tenantId: null,
        storeId: null,
        sessionId: tokens.sessionId,
        isPlatformAdmin: true,
        isSuperAdmin: admin.isSuperAdmin,
        adminPermissions: Array.isArray(admin.adminPermissions) ? (admin.adminPermissions as string[]) : [],
        mustChangePassword: Boolean((admin as any).mustChangePassword),
        isDeactivated: Boolean((admin as any).isDeactivated),
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900,
      },
    };
  }

  public async changeAdminPassword(
    userId: string,
    dto: { currentPassword?: string; newPassword: string },
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { credentials: true },
    });
    if (!user || user.deletedAt) {
      throw new NotFoundException('Administrator account not found.');
    }
    if (!user.isActive || (user as any).isDeactivated) {
      throw new ForbiddenException('Administrator account is not active.');
    }

    const newPass = (dto.newPassword || '').trim();
    if (newPass.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long.');
    }
    if (!/[A-Za-z]/.test(newPass) || !/[0-9]/.test(newPass)) {
      throw new BadRequestException('Password must contain both letters and numbers.');
    }

    const pinCred = user.credentials?.find((c) => c.credentialType === CredentialType.PIN);
    if (dto.currentPassword && pinCred?.pinHash) {
      const isCurrentValid = this.verifyPin(dto.currentPassword, pinCred.pinHash);
      if (!isCurrentValid) {
        throw new BadRequestException('Current password does not match.');
      }
    }

    const newPinHash = this.hashPin(newPass);

    await this.prisma.sellerCredential.upsert({
      where: {
        userId_credentialType: {
          userId: user.id,
          credentialType: CredentialType.PIN,
        },
      },
      update: {
        pinHash: newPinHash,
        failedPinAttempts: 0,
        lockedUntil: null,
      },
      create: {
        userId: user.id,
        credentialType: CredentialType.PIN,
        pinHash: newPinHash,
        failedPinAttempts: 0,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mustChangePassword: false,
      } as any,
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorType: 'ADMIN',
        action: 'ADMIN_PASSWORD_CHANGED',
        entityType: 'User',
        entityId: user.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: {
          email: user.email,
          module: 'Security',
          result: 'SUCCESS',
        },
      },
    });

    return {
      success: true,
      message: 'Password changed successfully. You may continue to the admin dashboard.',
    };
  }


  // ============================================================================
  // SESSION & TOKEN HELPERS
  // ============================================================================

  private async createSessionAndIssueTokens(
    user: any,
    tenantId?: string,
    storeId?: string,
    userAgent?: string,
    ipAddress?: string,
    deviceId?: string
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionHash = this.hashCode(sessionToken);
    let sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default for merchants/buyers
    if (user.role === 'PLATFORM_ADMIN' || user.isSuperAdmin) {
      const securitySetting = await this.prisma.platformSetting.findUnique({
        where: { key: 'security' },
      });
      const timeoutMinutes = Number((securitySetting?.value as any)?.adminSessionTimeoutMinutes ?? 60);
      sessionExpiry = new Date(Date.now() + timeoutMinutes * 60 * 1000);
    }

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tenantId: tenantId || null,
        storeId: storeId || null,
        deviceId: deviceId || null,
        tokenHash: sessionHash,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt: sessionExpiry,
      },
    });

    const refreshTokenPlain = crypto.randomBytes(40).toString('hex');
    const refreshHash = this.hashCode(refreshTokenPlain);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        sessionId: session.id,
        tokenHash: refreshHash,
        deviceName: userAgent?.slice(0, 100) || 'Registered Device',
        ipAddress: ipAddress || null,
        expiresAt: sessionExpiry,
      },
    });

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        phone: user.phone,
        role: user.role,
        tenantId,
        storeId,
        sessionId: session.id,
        isPlatformAdmin: user.isSuperAdmin || false,
      },
      {
        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m') as any,
      }
    );

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
      sessionId: session.id,
    };
  }

  // ============================================================================
  // LEGACY AUTH ENDPOINTS (BACKWARD COMPATIBILITY)
  // ============================================================================

  public async sendOtp(rawPhone: string) {
    const phone = normalizePhone(rawPhone);
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    const purpose = existing ? OtpPurpose.LOGIN : OtpPurpose.REGISTRATION;
    const res = await this.requestOtpChallenge(rawPhone, purpose);
    return { success: true, ...res };
  }

  public async verifyOtp(
    rawPhone: string,
    code: string,
    userAgent?: string,
    ipAddress?: string
  ) {
    const phone = normalizePhone(rawPhone);
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (!existing || !existing.isActive || existing.deletedAt) throw new UnauthorizedException('Use email registration to create an account.');
    await this.emailOtp.verify(phone, code.trim(), OtpPurpose.LOGIN);

    let user = await this.prisma.user.findUnique({
      where: { phone },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            tenant: {
              include: {
                stores: {
                  take: 1,
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          fullName: 'Merchant Seller',
          role: UserRole.SELLER_OWNER,
        },
        include: {
          memberships: {
            where: { isActive: true },
            include: {
              tenant: {
                include: {
                  stores: {
                    take: 1,
                    orderBy: { createdAt: 'asc' },
                  },
                },
              },
            },
          },
        },
      });
    }

    const primaryMembership = user.memberships[0];
    const tenant = primaryMembership?.tenant;
    const store = tenant?.stores?.[0];

    const tokens = await this.createSessionAndIssueTokens(user, tenant?.id, store?.id, userAgent, ipAddress);

    const authenticatedUser: AuthenticatedUser = {
      userId: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role as any,
      tenantId: tenant?.id || null,
      storeId: store?.id || null,
      sessionId: tokens.sessionId,
      isPlatformAdmin: user.isSuperAdmin,
    };

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: authenticatedUser,
      tenant,
      store,
    };
  }

  public async refreshTokens(
    rawRefreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashCode(rawRefreshToken.trim());

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: {
              where: { isActive: true },
              include: {
                tenant: {
                  include: {
                    stores: { take: 1, orderBy: { createdAt: 'asc' } },
                  },
                },
              },
            },
          },
        },
        session: true,
      },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or has expired.');
    }

    if (tokenRecord.session.isRevoked || tokenRecord.session.expiresAt < new Date()) {
      throw new UnauthorizedException('Underlying session has been revoked. Please log in again.');
    }

    if (!tokenRecord.user.isActive || tokenRecord.user.deletedAt) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact LetzShop Support.',
        },
        HttpStatus.FORBIDDEN
      );
    }

    const newRefreshTokenPlain = crypto.randomBytes(40).toString('hex');
    const newRefreshHash = this.hashCode(newRefreshTokenPlain);
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: tokenRecord.userId,
          sessionId: tokenRecord.sessionId,
          tokenHash: newRefreshHash,
          deviceName: userAgent?.slice(0, 100) || tokenRecord.deviceName,
          ipAddress: ipAddress || null,
          expiresAt: newExpiry,
        },
      }),
    ]);

    const primaryMembership = tokenRecord.user.memberships[0];
    const tenantId = primaryMembership?.tenantId || tokenRecord.session.tenantId || undefined;
    const storeId = primaryMembership?.tenant?.stores?.[0]?.id || tokenRecord.session.storeId || undefined;

    const accessToken = this.jwtService.sign(
      {
        sub: tokenRecord.userId,
        phone: tokenRecord.user.phone,
        role: tokenRecord.user.role,
        tenantId,
        storeId,
        sessionId: tokenRecord.sessionId,
        isPlatformAdmin: tokenRecord.user.isSuperAdmin,
      },
      {
        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m') as any,
      }
    );

    return {
      accessToken,
      refreshToken: newRefreshTokenPlain,
    };
  }

  public issueTokensForUser(
    user: { id: string; phone: string; role: any; isSuperAdmin?: boolean },
    tenantId: string,
    storeId: string,
    sessionId?: string
  ): { accessToken: string; user: AuthenticatedUser } {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      tenantId,
      storeId,
      sessionId,
      isPlatformAdmin: user.isSuperAdmin || false,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m') as any,
    });
    return {
      accessToken,
      user: {
        userId: user.id,
        phone: user.phone,
        role: user.role as any,
        tenantId,
        storeId,
        sessionId: sessionId || '',
        isPlatformAdmin: user.isSuperAdmin || false,
      },
    };
  }

  public async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      return false;
    }

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: sessionId },
        data: { isRevoked: true },
      }),
      this.prisma.refreshToken.updateMany({
        where: { sessionId },
        data: { isRevoked: true },
      }),
    ]);

    return true;
  }

  public async validateAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const payload = this.jwtService.verify(token);

      const session = await this.prisma.session.findUnique({
        where: { id: payload.sessionId },
        include: { user: true },
      });

      if (!session || session.isRevoked || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session is no longer valid or has been revoked.');
      }

      if (
        session.userId !== payload.sub ||
        !session.user.isActive ||
        (session.user as any).isDeactivated ||
        session.user.deletedAt
      ) {
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            code: (session.user as any).isDeactivated ? 'ACCOUNT_DEACTIVATED' : 'ACCOUNT_SUSPENDED',
            message: (session.user as any).isDeactivated
              ? 'Administrator account has been permanently deactivated.'
              : 'Your account has been suspended. Please contact LetzShop Support.',
          },
          HttpStatus.FORBIDDEN
        );
      }
      const isPlatformAdmin = session.user.isSuperAdmin || session.user.role === UserRole.PLATFORM_ADMIN;

      return {
        userId: payload.sub,
        phone: payload.phone,
        email: session.user.email || undefined,
        fullName: session.user.fullName || undefined,
        role: payload.role === UserRole.PLATFORM_ADMIN && !isPlatformAdmin ? session.user.role : payload.role,
        tenantId: payload.tenantId,
        storeId: payload.storeId,
        sessionId: payload.sessionId,
        isPlatformAdmin,
        isSuperAdmin: session.user.isSuperAdmin,
        adminPermissions: Array.isArray(session.user.adminPermissions)
          ? (session.user.adminPermissions as string[])
          : [],
        mustChangePassword: Boolean((session.user as any).mustChangePassword),
        isDeactivated: Boolean((session.user as any).isDeactivated),
      };
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new UnauthorizedException(err.message || 'Invalid authentication token.');
    }
  }

  public async activateSubAdmin(
    data: { token: string; pin: string; fullName?: string; phone?: string },
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    user: AuthenticatedUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    if (!data.token?.trim()) {
      throw new BadRequestException('Activation token is required.');
    }
    if (!/^\d{6}$/.test(data.pin)) {
      throw new BadRequestException('PIN must be exactly 6 numeric digits.');
    }

    const tokenHash = this.hashCode(data.token.trim());
    const invite = await this.prisma.adminInvite.findUnique({
      where: { tokenHash },
    });

    if (!invite) {
      throw new BadRequestException('Invalid activation link.');
    }
    if (invite.acceptedAt) {
      throw new BadRequestException('This invitation has already been accepted. Please log in.');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired. Please request a new invite.');
    }

    const pinHash = this.hashPin(data.pin);

    // Check if user with this email or phone exists
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: invite.email, mode: 'insensitive' } },
          ...(invite.phone ? [{ phone: invite.phone }] : []),
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
        deletedAt: null,
      },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: UserRole.PLATFORM_ADMIN,
          isSuperAdmin: false,
          isActive: true,
          adminPermissions: invite.permissions as any,
          fullName: data.fullName?.trim() || invite.fullName || user.fullName,
        },
      });
    } else {
      const userPhone = data.phone?.trim() || invite.phone || `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
      user = await this.prisma.user.create({
        data: {
          email: invite.email.toLowerCase().trim(),
          phone: userPhone,
          fullName: data.fullName?.trim() || invite.fullName,
          role: UserRole.PLATFORM_ADMIN,
          isSuperAdmin: false,
          isActive: true,
          adminPermissions: invite.permissions as any,
        },
      });
    }

    // Set credential PIN
    await this.prisma.sellerCredential.upsert({
      where: {
        userId_credentialType: {
          userId: user.id,
          credentialType: CredentialType.PIN,
        },
      },
      update: {
        pinHash,
        failedPinAttempts: 0,
        lockedUntil: null,
      },
      create: {
        userId: user.id,
        credentialType: CredentialType.PIN,
        pinHash,
        failedPinAttempts: 0,
      },
    });

    // Mark invite as accepted
    await this.prisma.adminInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'SUB_ADMIN_ACTIVATED',
        entityType: 'User',
        entityId: user.id,
        metadata: {
          email: user.email,
          inviteId: invite.id,
        },
      },
    });

    const tokens = await this.createSessionAndIssueTokens(user, undefined, undefined, userAgent, ipAddress);

    return {
      user: {
        userId: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role as any,
        tenantId: null,
        storeId: null,
        sessionId: tokens.sessionId,
        isPlatformAdmin: true,
        isSuperAdmin: false,
        adminPermissions: Array.isArray(user.adminPermissions) ? (user.adminPermissions as string[]) : [],
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900,
      },
    };
  }

  // ============================================================================
  // CRYPTOGRAPHIC UTILITIES
  // ============================================================================

  private hashCode(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  private hashPin(pin: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPin(pin: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const computedHash = crypto.scryptSync(pin, salt, 64).toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
    } catch {
      return false;
    }
  }
}
