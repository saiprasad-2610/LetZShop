import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsObject,
  MinLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductMode, OptionType, ProductStatus, VariantStatus } from '@simply/types';

export class CreateOptionValueDto {
  @ApiPropertyOptional({ example: 'opt-val-123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Navy' })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiPropertyOptional({ example: '#000080' })
  @IsOptional()
  @IsString()
  colorHex?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProductOptionDto {
  @ApiPropertyOptional({ example: 'opt-123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Colour' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: OptionType, default: OptionType.CUSTOM })
  @IsOptional()
  @IsEnum(OptionType)
  type?: OptionType = OptionType.CUSTOM;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ type: [CreateOptionValueDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionValueDto)
  values: CreateOptionValueDto[];
}

export class CreateProductVariantDto {
  @ApiPropertyOptional({ example: 'var-123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'AUR-LSH-NVY-S' })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 249900, description: 'Price in paise (e.g. 249900 = ₹2,499.00)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  pricePaise?: number;

  @ApiPropertyOptional({ example: 299900 })
  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPricePaise?: number;

  @ApiPropertyOptional({ example: 25, description: 'Initial stock quantity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  initialStock?: number;

  @ApiPropertyOptional({ example: 25, description: 'Stock quantity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiProperty({
    example: ['Navy', 'S'],
    description: 'Selected option value strings matching product options',
  })
  @IsArray()
  @IsString({ each: true })
  optionValues: string[];

  @ApiPropertyOptional({ example: 'media-asset-id-123', description: 'Associated variant photo media asset ID' })
  @IsOptional()
  @IsString()
  mediaAssetId?: string;

  @ApiPropertyOptional({ enum: VariantStatus, default: VariantStatus.ACTIVE })
  @IsOptional()
  @IsEnum(VariantStatus)
  status?: VariantStatus;
}

export class CreateProductAttributeDto {
  @ApiProperty({ example: 'Material' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'SS316' })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiPropertyOptional({ example: 'TEXT', default: 'TEXT' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ProductMediaItemDto {
  @ApiProperty({ example: 'media-asset-id-123' })
  @IsNotEmpty()
  @IsString()
  mediaAssetId: string;

  @ApiPropertyOptional({ example: 'opt-val-123' })
  @IsOptional()
  @IsString()
  optionValueId?: string;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  optionValue?: string;

  @ApiPropertyOptional({ example: 'var-123' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProductDto {
  @ApiPropertyOptional({ example: 'prod-123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'a4000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 'Classic Linen Shirt' })
  @IsNotEmpty({ message: 'Product name is required.' })
  @IsString({ message: 'Product name must be a string.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(2, { message: 'Product name must be at least 2 characters.' })
  name: string;

  @ApiPropertyOptional({ example: 'classic-linen-shirt' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Breathable, timeless tailored luxury French linen shirt.' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiProperty({ enum: ProductMode, default: ProductMode.SELL_ONLINE })
  @IsEnum(ProductMode, { message: 'Mode must be SELL_ONLINE, ENQUIRY_ONLY, or SELL_AND_ENQUIRY.' })
  mode: ProductMode;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ example: 79900, description: 'Base price in paise' })
  @IsOptional()
  @IsInt({ message: 'Price must be an integer in paise.' })
  @Min(0, { message: 'Price cannot be negative.' })
  pricePaise?: number;

  @ApiPropertyOptional({ example: 99900, description: 'Compare-at price in paise' })
  @IsOptional()
  @IsInt({ message: 'Compare-at price must be an integer in paise.' })
  @Min(0, { message: 'Compare-at price cannot be negative.' })
  compareAtPricePaise?: number;

  @ApiPropertyOptional({ example: 10, description: 'Initial stock on hand' })
  @IsOptional()
  @IsInt({ message: 'Stock must be an integer quantity.' })
  @Min(0, { message: 'Stock cannot be negative.' })
  stock?: number;

  @ApiPropertyOptional({ example: 'SHIRT-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: ['media-uuid-1'], description: 'Media asset IDs to attach' })
  @IsOptional()
  @IsArray({ message: 'mediaAssetIds must be an array.' })
  @IsString({ each: true })
  mediaAssetIds?: string[];

  @ApiPropertyOptional({ type: [ProductMediaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductMediaItemDto)
  media?: ProductMediaItemDto[];

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

  @ApiPropertyOptional({ type: [CreateProductAttributeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductAttributeDto)
  attributes?: CreateProductAttributeDto[];

  @ApiPropertyOptional({ type: [CreateProductOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionDto)
  options?: CreateProductOptionDto[];

  @ApiPropertyOptional({ type: [CreateProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}
