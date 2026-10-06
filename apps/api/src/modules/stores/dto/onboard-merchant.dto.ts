import { IsNotEmpty, IsOptional, IsString, Length, Matches, IsUrl, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { INDIAN_PHONE_REGEX, normalizePhone, BUSINESS_NAME_REGEX } from '@simply/validation';

export class OnboardMerchantDto {
  @ApiProperty({ example: 'Royal Silk Emporium', description: 'Business / store brand name' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Business name must be a string' })
  @Length(2, 100, { message: 'Business name must be between 2 and 100 characters' })
  @Matches(BUSINESS_NAME_REGEX, { message: 'Business name contains invalid characters' })
  @IsNotEmpty({ message: 'Business name is required' })
  businessName: string;

  @ApiProperty({ example: 'Fashion', description: 'Business category' })
  @IsNotEmpty({ message: 'Business category is required' })
  @IsString({ message: 'Business category must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  category: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false, description: 'Optional logo image URL' })
  @IsOptional()
  @Transform(({ value }) => (!value || value === '' ? undefined : value))
  @IsUrl({}, { message: 'Logo URL must be a valid URL format' })
  logoUrl?: string;

  @ApiProperty({ example: '+919876543210', description: 'Store contact mobile number in +91 format' })
  @IsNotEmpty({ message: 'Contact phone number is required' })
  @IsString({ message: 'Contact phone must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizePhone(value) : value))
  @Matches(INDIAN_PHONE_REGEX, { message: 'Phone number must use +91XXXXXXXXXX format' })
  contactPhone: string;

  @ApiProperty({ example: 'contact@royalsilk.com', required: false, description: 'Store support email' })
  @IsOptional()
  @Transform(({ value }) => (!value || value === '' ? undefined : (typeof value === 'string' ? value.trim().toLowerCase() : value)))
  @IsEmail({}, { message: 'Contact email must be a valid email address' })
  contactEmail?: string;

  @ApiProperty({ example: 'Surat, Gujarat', required: false, description: 'Store physical location / address' })
  @IsOptional()
  @Transform(({ value }) => (!value || value === '' ? undefined : value))
  @IsString({ message: 'Address must be a string' })
  @Length(0, 255, { message: 'Address must not exceed 255 characters' })
  address?: string;

  @ApiProperty({ example: 'Surat', required: false, description: 'Store city' })
  @IsOptional()
  @Transform(({ value }) => (!value || value === '' ? undefined : value))
  @IsString({ message: 'City must be a string' })
  city?: string;

  @ApiProperty({ example: 'Gujarat', required: false, description: 'Store state' })
  @IsOptional()
  @Transform(({ value }) => (!value || value === '' ? undefined : value))
  @IsString({ message: 'State must be a string' })
  state?: string;
}
