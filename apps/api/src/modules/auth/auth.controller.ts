import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto } from './dto/auth.dto';
import { Public, CurrentUser } from '../../common/decorators';
import { AuthenticatedUser } from '@simply/types';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for seller phone onboarding / login' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code and receive access & refresh tokens' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: any) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.authService.verifyOtp(dto.phone, dto.code, userAgent, ipAddress);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and obtain new short-lived access token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: any) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.authService.refreshTokens(dto.refreshToken, userAgent, ipAddress);
  }

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
}
