import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpProvider, SendOtpResult } from '../interfaces/otp-provider.interface';
import * as twilio from 'twilio';

@Injectable()
export class TwilioOtpProvider implements OtpProvider {
  private readonly logger = new Logger(TwilioOtpProvider.name);
  private client: twilio.Twilio | null = null;
  private readonly fromNumber: string;
  public readonly isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';
    
    // Fall back to Mock Provider behavior if credentials are not configured or are placeholders
    this.isEnabled = !!accountSid && !!authToken && accountSid.startsWith('AC');

    if (this.isEnabled && accountSid && authToken) {
      try {
        this.client = new twilio.Twilio(accountSid, authToken);
        this.logger.log('🚀 Twilio SMS Provider successfully initialized for Production-Level OTPs');
      } catch (err: any) {
        this.logger.error(`Failed to initialize Twilio: ${err.message}`);
        this.isEnabled = false;
      }
    } else {
      this.logger.warn('SMS OTP unavailable: Twilio is not configured.');
    }
  }

  async sendOtp(phone: string, code: string): Promise<SendOtpResult> {
    if (!this.isEnabled || !this.client) {
      return { success: false, isMock: false };
    }

    try {
      const message = await this.client.messages.create({
        body: `Your Simply E-Commerce Verification Code is: ${code}. Do not share this code with anyone.`,
        from: this.fromNumber,
        to: phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`, // Ensures E.164 format for India
      });
      
      this.logger.log(`✓ Real SMS dispatched to ${phone}. SID: ${message.sid}`);
      return {
        success: true,
        messageId: message.sid,
        isMock: false,
      };
    } catch (error: any) {
      this.logger.error('SMS verification delivery failed.');
      return {
        success: false,
        isMock: false,
      };
    }
  }
}
