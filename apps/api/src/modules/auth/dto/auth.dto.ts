import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { INDIAN_PHONE_REGEX } from '@simply/validation';

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Indian 10-digit mobile number' })
  @IsNotEmpty()
  @IsString()
  @Matches(INDIAN_PHONE_REGEX, { message: 'Must be a valid 10-digit Indian phone number' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsNotEmpty()
  @IsString()
  @Matches(INDIAN_PHONE_REGEX, { message: 'Must be a valid 10-digit Indian phone number' })
  phone: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Rotating refresh token string' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
