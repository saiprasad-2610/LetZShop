import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto, SetupPinDto, PinLoginDto, AdminLoginDto } from './dto/auth.dto';
import { Public, CurrentUser } from '../../common/decorators';
import { AuthenticatedUser, OtpPurpose } from '@simply/types';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================================================
  // CANONICAL SELLER AUTH (FIRST REGISTRATION)
  // ============================================================================

  @Public()
  @Post('register/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 1: Request OTP for seller mobile registration' })
  async registerRequestOtp(@Body() dto: SendOtpDto) {
    return this.authService.requestOtpChallenge(dto.phone, OtpPurpose.REGISTRATION as any);
  }

  @Public()
  @Post('register/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 2: Verify OTP for seller registration and obtain verificationToken' })
  async registerVerifyOtp(@Body() dto: VerifyOtpDto) {
    const code = dto.code || dto.otp;
    if (!code) throw new BadRequestException('OTP code is required.');
    return this.authService.verifyOtpChallenge(dto.phone, code, OtpPurpose.REGISTRATION as any);
  }

  @Public()
  @Post('pin/setup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Step 3: Set up security PIN and create/activate seller account' })
  async setupPin(@Body() dto: SetupPinDto, @Req() req: any) {
    const authHeader = req.headers?.authorization;
    let token = dto.verificationToken;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    const userAgent = req.headers?.['user-agent'];
    const ipAddress = req.ip || req.headers?.['x-forwarded-for'];
    return this.authService.setupPin(
      {
        ...dto,
        verificationToken: token || '',
        phone: dto.phone || '',
        fullName: dto.fullName || 'Merchant Seller',
      },
      userAgent,
      ipAddress
    );
  }

  // ============================================================================
  // CANONICAL SELLER AUTH (SUBSEQUENT ACCESS VIA PIN)
  // ============================================================================

  @Public()
  @Post('pin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subsequent seller login using mobile number & security PIN' })
  async pinLogin(@Body() dto: PinLoginDto, @Req() req: any) {
    const userAgent = req.headers?.['user-agent'];
    const ipAddress = req.ip || req.headers?.['x-forwarded-for'];
    return this.authService.loginWithPin(dto.phone, dto.pin, dto.deviceFingerprint, userAgent, ipAddress);
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Platform SuperAdmin credential authentication (Email/Phone & Password/PIN)' })
  async adminLogin(@Body() dto: AdminLoginDto, @Req() req: any) {
    const userAgent = req.headers?.['user-agent'];
    const ipAddress = req.ip || req.headers?.['x-forwarded-for'];
    return this.authService.loginAdmin(dto.identifier, dto.secret, userAgent, ipAddress);
  }

  @Public()
  @Post('admin/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate Sub Admin account via invite token and set PIN' })
  async activateSubAdmin(
    @Body() dto: { token: string; pin: string; fullName?: string; phone?: string },
    @Req() req: any
  ) {
    const userAgent = req.headers?.['user-agent'];
    const ipAddress = req.ip || req.headers?.['x-forwarded-for'];
    return this.authService.activateSubAdmin(dto, userAgent, ipAddress);
  }

  @Public()
  @Post('session/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and obtain new short-lived access token' })
  async sessionRefresh(@Body() dto: RefreshTokenDto, @Req() req: any) {
    const userAgent = req.headers?.['user-agent'];
    const ipAddress = req.ip || req.headers?.['x-forwarded-for'];
    return this.authService.refreshTokens(dto.refreshToken, userAgent, ipAddress);
  }

  // ============================================================================
  // ACCOUNT RECOVERY (FORGOT PIN)
  // ============================================================================

  @Public()
  @Post('recovery/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP challenge to recover access / reset PIN' })
  async recoveryRequestOtp(@Body() dto: SendOtpDto) {
    return this.authService.requestOtpChallenge(dto.phone, OtpPurpose.RECOVERY as any);
  }

  @Public()
  @Post('recovery/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP challenge for recovery and obtain verificationToken to reset PIN' })
  async recoveryVerifyOtp(@Body() dto: VerifyOtpDto) {
    const code = dto.code || dto.otp;
    if (!code) throw new BadRequestException('OTP code is required.');
    return this.authService.verifyOtpChallenge(dto.phone, code, OtpPurpose.RECOVERY as any);
  }

  // ============================================================================
  // SESSION LOGOUT & IDENTITY
  // ============================================================================

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active server-side session and logout' })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    if (user?.sessionId) {
      await this.authService.revokeSession(user.sessionId, user.userId);
    }
    return { success: true, message: 'Logged out successfully. Session revoked.' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get profile and active session context of logged in user' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  // ============================================================================
  // BACKWARD COMPATIBLE ROUTES
  // ============================================================================

  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Legacy: Request OTP for seller phone onboarding / login' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Legacy: Verify OTP code and receive access & refresh tokens' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: any) {
    const userAgent = req.headers?.['user-agent'];
    const ipAddress = req.ip || req.headers?.['x-forwarded-for'];
    const code = dto.code || dto.otp || '';
    return this.authService.verifyOtp(dto.phone, code, userAgent, ipAddress);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Legacy: Rotate refresh token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: any) {
    const userAgent = req.headers?.['user-agent'];
    const ipAddress = req.ip || req.headers?.['x-forwarded-for'];
    return this.authService.refreshTokens(dto.refreshToken, userAgent, ipAddress);
  }
}
