import { Injectable, Logger } from '@nestjs/common';
import { OtpProvider, SendOtpResult } from '../interfaces/otp-provider.interface';

@Injectable()
export class DevOtpProvider implements OtpProvider {
  private readonly logger = new Logger(DevOtpProvider.name);

  async sendOtp(phone: string, code: string): Promise<SendOtpResult> {
    if (process.env.NODE_ENV !== 'test') throw new Error('Test OTP provider is restricted to NODE_ENV=test');
    return {
      success: true,
      messageId: `dev_mock_${Date.now()}`,
      isMock: true,
    };
  }
}
