import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { DevOtpProvider } from './providers/dev-otp.provider';
import { AuthenticatedUser } from '@simply/types';
import { normalizePhone, isValidIndianPhone } from '@simply/validation';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpExpirySeconds: number;
  private readonly maxAttempts: number;
  private readonly devMockEnabled: boolean;
  private readonly devDefaultCode: string;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpProvider: DevOtpProvider
  ) {
    this.otpExpirySeconds = Number(this.configService.get('OTP_EXPIRY_SECONDS')) || 300;
    this.maxAttempts = Number(this.configService.get('OTP_MAX_ATTEMPTS')) || 5;
    this.devMockEnabled = this.configService.get<string>('OTP_DEV_MOCK_ENABLED', 'true') === 'true';
    this.devDefaultCode = this.configService.get<string>('OTP_DEV_DEFAULT_CODE', '123456');
  }

  public async sendOtp(rawPhone: string): Promise<{ success: boolean; message: string; cooldownSeconds: number }> {
    const phone = normalizePhone(rawPhone);
    if (!isValidIndianPhone(phone)) {
      throw new BadRequestException('Please provide a valid Indian 10-digit mobile number.');
    }

    // Rate-limiting / cooldown check: Check recent unverified OTP within last 60 seconds
    const recentRequest = await this.prisma.otpRequest.findFirst({
      where: {
        phone,
        isVerified: false,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentRequest) {
      throw new BadRequestException('Please wait at least 60 seconds before requesting a new OTP.');
    }

    // Determine OTP code
    const otpCode = this.devMockEnabled
      ? this.devDefaultCode
      : Math.floor(100000 + Math.random() * 900000).toString();

    const codeHash = this.hashCode(otpCode);
    const expiresAt = new Date(Date.now() + this.otpExpirySeconds * 1000);

    await this.prisma.otpRequest.create({
      data: {
        phone,
        codeHash,
        maxAttempts: this.maxAttempts,
        expiresAt,
      },
    });

    await this.otpProvider.sendOtp(phone, otpCode);

    return {
      success: true,
      message: 'OTP sent successfully to your mobile number.',
      cooldownSeconds: 60,
    };
  }

  public async verifyOtp(
    rawPhone: string,
    code: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: AuthenticatedUser;
    tenant?: any;
    store?: any;
  }> {
    const phone = normalizePhone(rawPhone);
    const codeHash = this.hashCode(code.trim());

    const otpRequest = await this.prisma.otpRequest.findFirst({
      where: {
        phone,
        isVerified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRequest) {
      throw new BadRequestException('No active OTP request found. Please request a new OTP.');
    }

    if (otpRequest.attempts >= otpRequest.maxAttempts) {
      throw new BadRequestException('Maximum OTP verification attempts exceeded. Please request a new OTP.');
    }

    // Verify hash
    if (otpRequest.codeHash !== codeHash) {
      await this.prisma.otpRequest.update({
        where: { id: otpRequest.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid OTP entered. Please try again.');
    }

    // Mark verified
    await this.prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { isVerified: true, verifiedAt: new Date() },
    });

    // Find or create user
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

    // Create server-side session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionHash = this.hashCode(sessionToken);
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tenantId: tenant?.id || null,
        storeId: store?.id || null,
        tokenHash: sessionHash,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt: sessionExpiry,
      },
    });

    // Create Refresh Token
    const refreshTokenPlain = crypto.randomBytes(40).toString('hex');
    const refreshHash = this.hashCode(refreshTokenPlain);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        sessionId: session.id,
        tokenHash: refreshHash,
        deviceName: userAgent?.slice(0, 100) || 'Unknown Device',
        ipAddress: ipAddress || null,
        expiresAt: sessionExpiry,
      },
    });

    const authenticatedUser: AuthenticatedUser = {
      userId: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role as any,
      tenantId: tenant?.id || null,
      storeId: store?.id || null,
      sessionId: session.id,
      isPlatformAdmin: user.isSuperAdmin,
    };

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        phone: user.phone,
        role: user.role,
        tenantId: tenant?.id,
        storeId: store?.id,
        sessionId: session.id,
        isPlatformAdmin: user.isSuperAdmin,
      },
      {
        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m') as any,
      }
    );

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
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
        user: true,
        session: true,
      },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh session. Please log in again.');
    }

    if (tokenRecord.session.isRevoked || tokenRecord.session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has been revoked or expired.');
    }

    // Rotating Refresh Token: revoke old token
    const newRefreshTokenPlain = crypto.randomBytes(40).toString('hex');
    const newRefreshHash = this.hashCode(newRefreshTokenPlain);

    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const newTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        sessionId: tokenRecord.sessionId,
        tokenHash: newRefreshHash,
        deviceName: userAgent?.slice(0, 100) || tokenRecord.deviceName,
        ipAddress: ipAddress || tokenRecord.ipAddress,
        expiresAt: newExpiry,
      },
    });

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        isRevoked: true,
        replacedByTokenId: newTokenRecord.id,
      },
    });

    const accessToken = this.jwtService.sign(
      {
        sub: tokenRecord.user.id,
        phone: tokenRecord.user.phone,
        role: tokenRecord.user.role,
        tenantId: tokenRecord.session.tenantId,
        storeId: tokenRecord.session.storeId,
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

      // Verify session is active in database
      const session = await this.prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || session.isRevoked || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session is no longer valid or has been revoked.');
      }

      return {
        userId: payload.sub,
        phone: payload.phone,
        role: payload.role,
        tenantId: payload.tenantId,
        storeId: payload.storeId,
        sessionId: payload.sessionId,
        isPlatformAdmin: payload.isPlatformAdmin || false,
      };
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Invalid authentication token.');
    }
  }

  private hashCode(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
