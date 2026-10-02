import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { GuestCheckoutDto } from './dto/checkout.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, CurrentUser, Public } from '../../common/decorators';
import { AuthenticatedUser, TenantContext } from '@simply/types';
import { OrderStatus } from '@prisma/client';

@ApiTags('Orders & Checkout')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 1. Guest-First Checkout (Public)
  @Public()
  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Guest-first checkout with address and stock reservation' })
  async checkout(@Body() dto: GuestCheckoutDto) {
    return this.ordersService.createGuestOrder(dto);
  }

  @Public()
  @Get('track/:orderNumber')
  @ApiOperation({ summary: 'Secure public guest order tracking with cryptographic tracking token' })
  async trackOrder(
    @Param('orderNumber') orderNumber: string,
    @Query('t') token?: string
  ) {
    return this.ordersService.trackOrder(orderNumber, token);
  }

  // 2. Merchant Order Management (Authenticated + TenantGuard)
  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get()
  @ApiOperation({ summary: 'List orders for authenticated merchant store' })
  async getOrders(
    @CurrentTenant() tenant: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus
  ) {
    return this.ordersService.getOrders(tenant, { page, limit, status });
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get order details strictly scoped to merchant store' })
  async getOrderById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string
  ) {
    return this.ordersService.getOrderById(id, tenant);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Put(':id/status')
  @ApiOperation({ summary: 'Transition order status with history tracking' })
  async updateStatus(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; reason?: string }
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      body.status,
      tenant,
      body.reason,
      user.userId
    );
  }
}
