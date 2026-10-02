import { IsNotEmpty, IsString, IsOptional, IsEmail, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { INDIAN_PHONE_REGEX, INDIAN_PINCODE_REGEX } from '@simply/validation';

export class CheckoutAddressDto {
  @ApiProperty({ example: 'B-402, Sea Green Apartments' })
  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Worli Sea Face' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Opposite Worli Dairy' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ example: '400018' })
  @IsNotEmpty()
  @IsString()
  @Matches(INDIAN_PINCODE_REGEX, { message: 'Must be a valid 6-digit Indian PIN code' })
  pincode: string;

  @ApiPropertyOptional({ example: 'India', default: 'India' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class GuestCheckoutDto {
  @ApiProperty({ example: 'a3000000-0000-0000-0000-000000000001' })
  @IsNotEmpty()
  @IsString()
  storeId: string;

  @ApiProperty({ example: 'c1000000-0000-0000-0000-000000000001' })
  @IsNotEmpty()
  @IsString()
  cartId: string;

  @ApiProperty({ example: 'Rohan Mehta' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+919811122233' })
  @IsNotEmpty()
  @IsString()
  @Matches(INDIAN_PHONE_REGEX, { message: 'Must be a valid 10-digit Indian phone number' })
  phone: string;

  @ApiPropertyOptional({ example: 'rohan.mehta@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ type: CheckoutAddressDto })
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  deliveryAddress: CheckoutAddressDto;

  @ApiPropertyOptional({ example: 'Please call before delivery' })
  @IsOptional()
  @IsString()
  notes?: string;
}
