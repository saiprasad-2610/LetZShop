import { Injectable, Logger } from '@nestjs/common';
import { OtpProvider, SendOtpResult } from '../interfaces/otp-provider.interface';

@Injectable()
export class DevOtpProvider implements OtpProvider {
  private readonly logger = new Logger(DevOtpProvider.name);

  async sendOtp(phone: string, code: string): Promise<SendOtpResult> {
    // Safe DEV implementation: Logs OTP code to console, strictly never dispatches a real SMS
    this.logger.log(`[SAFE DEV OTP PROVIDER] Phone: ${phone} | Verification OTP Code: [ ${code} ]`);
    return {
      success: true,
      messageId: `dev_mock_${Date.now()}`,
      isMock: true,
    };
  }
}
