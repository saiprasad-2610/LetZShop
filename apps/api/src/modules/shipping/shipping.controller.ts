import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService, DispatchOptions } from './shipping.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, Public } from '../../common/decorators';
import { TenantContext } from '@simply/types';

@ApiTags('Shipping & Logistics')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Post('orders/:orderId/ship')
  @ApiOperation({ summary: 'Create shipment & manifest for an accepted order (Shiprocket or Self-Delivery)' })
  async createShipment(
    @CurrentTenant() tenant: TenantContext,
    @Param('orderId') orderId: string,
    @Body() body?: DispatchOptions
  ) {
    return this.shippingService.createShipmentForOrder(orderId, tenant, body);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Post('orders/:orderId/sync-tracking')
  @ApiOperation({ summary: 'Pull latest real-time tracking status from Shiprocket API' })
  async syncTracking(
    @CurrentTenant() tenant: TenantContext,
    @Param('orderId') orderId: string
  ) {
    return this.shippingService.syncShiprocketTracking(orderId, tenant);
  }

  @Public()
  @Get('track/:awb')
  @ApiOperation({ summary: 'Public shipment tracking by AWB number' })
  async trackShipment(@Param('awb') awb: string) {
    return this.shippingService.trackShipment(awb);
  }
}
