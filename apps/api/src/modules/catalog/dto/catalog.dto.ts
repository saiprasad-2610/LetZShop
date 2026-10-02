import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductMode, OptionType } from '@simply/types';

export class CreateOptionValueDto {
  @ApiProperty({ example: 'Navy' })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiPropertyOptional({ example: '#000080' })
  @IsOptional()
  @IsString()
  colorHex?: string;
}

export class CreateProductOptionDto {
  @ApiProperty({ example: 'Colour' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: OptionType, default: OptionType.CUSTOM })
  @IsEnum(OptionType)
  type: OptionType;

  @ApiProperty({ type: [CreateOptionValueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionValueDto)
  values: CreateOptionValueDto[];
}

export class CreateProductVariantDto {
  @ApiProperty({ example: 'AUR-LSH-NVY-S' })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 249900, description: 'Price in paise (e.g. 249900 = ₹2,499.00)' })
  @IsInt()
  @Min(0)
  pricePaise: number;

  @ApiPropertyOptional({ example: 299900 })
  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPricePaise?: number;

  @ApiProperty({ example: 25, description: 'Initial stock quantity' })
  @IsInt()
  @Min(0)
  initialStock: number;

  @ApiProperty({
    example: ['Navy', 'S'],
    description: 'Selected option value strings matching product options',
  })
  @IsArray()
  @IsString({ each: true })
  optionValues: string[];
}

export class CreateProductDto {
  @ApiPropertyOptional({ example: 'a4000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 'Classic Linen Shirt' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'classic-linen-shirt' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Breathable, timeless tailored luxury French linen shirt.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ProductMode, default: ProductMode.SELL_ONLINE })
  @IsEnum(ProductMode)
  mode: ProductMode;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQuantity?: number;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  leadTimeDays?: number;

  @ApiPropertyOptional({ example: 'https://example.com/spec-sheet.pdf' })
  @IsOptional()
  @IsString()
  brochureUrl?: string;

  @ApiPropertyOptional({ example: { material: '100% Linen', threadCount: 200 } })
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Request Quotation' })
  @IsOptional()
  @IsString()
  enquiryCtaText?: string;

  @ApiProperty({ type: [CreateProductOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionDto)
  options: CreateProductOptionDto[];

  @ApiProperty({ type: [CreateProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants: CreateProductVariantDto[];
}
