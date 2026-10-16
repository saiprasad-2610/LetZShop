import { IsNotEmpty, IsOptional, IsString, Matches, Length, MaxLength } from 'class-validator';
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

  @ApiProperty({ example: '123456', description: '6-digit OTP code', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: '123456', description: 'Alternative alias for code', required: false })
  @IsOptional()
  @IsString()
  otp?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Rotating refresh token string' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class SetupPinDto {
  @ApiProperty({ description: 'Verification token from verified registration/recovery challenge', required: false })
  @IsOptional()
  @IsString()
  verificationToken?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123456', description: 'Exact 6-digit security PIN' })
  @IsNotEmpty({ message: 'PIN is required' })
  @IsString({ message: 'PIN must be a string' })
  @Length(6, 6, { message: 'PIN must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'PIN must contain exactly 6 numeric digits' })
  pin: string;

  @ApiProperty({ example: 'Sohan Katageri', description: 'Seller full name', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: 'owner@example.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;
}

export class PinLoginDto {
  @ApiProperty({ example: '+919876543210' })
  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsString({ message: 'Mobile number must be a string' })
  @Matches(INDIAN_PHONE_REGEX, { message: 'Enter a valid 10-digit mobile number' })
  phone: string;

  @ApiProperty({ example: '123456', description: 'Exact 6-digit security PIN' })
  @IsNotEmpty({ message: 'PIN is required' })
  @IsString({ message: 'PIN must be a string' })
  @Length(6, 6, { message: 'PIN must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'PIN must contain exactly 6 numeric digits' })
  pin: string;

  @ApiProperty({ example: 'dev_fp_chrome_win_xyz', required: false })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@shopongo.com', description: 'Admin Email or Mobile Number' })
  @IsNotEmpty({ message: 'Email or mobile number is required' })
  @MaxLength(254)
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'Administrator password' })
  @IsNotEmpty({ message: 'Password or PIN is required' })
  @MaxLength(256)
  @IsString()
  secret: string;
}
