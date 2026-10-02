import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DevOtpProvider } from './providers/dev-otp.provider';

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
  providers: [AuthService, DevOtpProvider],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
