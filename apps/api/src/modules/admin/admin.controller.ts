import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { AuthenticatedUser, UserRole } from '@simply/types';

@ApiTags('Platform Admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform-wide operational overview & metrics' })
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get('merchants')
  @ApiOperation({ summary: 'List all platform merchants with store & subscription status' })
  async getMerchants(@Query('search') search?: string) {
    return this.adminService.getMerchants(search);
  }

  @Get('merchants/:id')
  @ApiOperation({ summary: 'Get full merchant detail, stores, and subscriptions' })
  async getMerchantById(@Param('id') id: string) {
    return this.adminService.getMerchantById(id);
  }

  @Post('merchants/:id/suspend')
  @ApiOperation({ summary: 'Suspend merchant access with audit logging' })
  async suspendMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    return this.adminService.suspendMerchant(id, user.userId, reason || 'Administrative suspension');
  }

  @Post('merchants/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate suspended merchant with audit logging' })
  async reactivateMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    return this.adminService.reactivateMerchant(id, user.userId, reason || 'Administrative reactivation');
  }

  @Get('commerce')
  @ApiOperation({ summary: 'Cross-platform operational monitoring for orders, payments, refunds' })
  async getCommerceMonitoring() {
    return this.adminService.getCommerceMonitoring();
  }

  @Get('operations')
  @ApiOperation({ summary: 'Operational health, failed outbox events, and audit trail' })
  async getOperationsSummary() {
    return this.adminService.getOperationsSummary();
  }

  @Post('operations/retry-outbox/:id')
  @ApiOperation({ summary: 'Retry a failed outbox event with audit trail' })
  async retryOutboxEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.adminService.retryOutboxEvent(id, user.userId);
  }

  @Post('operations/reconcile-payment/:id')
  @ApiOperation({ summary: 'Reconcile payment order against gateway with audit trail' })
  async reconcilePaymentOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.adminService.reconcilePaymentOrder(id, user.userId);
  }
}
