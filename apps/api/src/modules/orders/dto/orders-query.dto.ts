import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from '@prisma/client';

export class GetOrdersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ description: 'Search by order number, customer name, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by OrderStatus or special filter NEEDS_ACTION' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Alias for status' })
  @IsOptional()
  @IsString()
  orderStatus?: string;

  @ApiPropertyOptional({ description: 'Filter by PaymentStatus' })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiPropertyOptional({ description: 'Filter by FulfillmentStatus' })
  @IsOptional()
  @IsString()
  fulfillmentStatus?: string;

  @ApiPropertyOptional({ description: 'Filter orders created on or after this ISO date' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter orders created on or before this ISO date' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'Target order status to transition to' })
  @IsEnum(OrderStatus, { message: 'Must be a valid canonical OrderStatus' })
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Optional explanation or cancellation reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}
