export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  isMock: boolean;
}

export interface OtpProvider {
  sendOtp(phone: string, code: string): Promise<SendOtpResult>;
}
