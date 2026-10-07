import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DevOtpProvider } from './providers/dev-otp.provider';
import { TwilioOtpProvider } from './providers/twilio-otp.provider';

const OtpProviderFactory = {
  provide: 'OTP_PROVIDER',
  useFactory: (configService: ConfigService) => {
    const isMockEnabled = configService.get<string>('OTP_DEV_MOCK_ENABLED') === 'true';
    if (!isMockEnabled) {
      return new TwilioOtpProvider(configService);
    }
    return new DevOtpProvider();
  },
  inject: [ConfigService],
};
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET', 'default-dev-secret-change-me'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpProviderFactory],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
