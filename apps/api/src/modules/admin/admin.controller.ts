import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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

  @Get('session')
  getSession(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }

  @Get('subscriptions')
  getSubscriptions(@Query('tenantId') tenantId?: string) { return this.adminService.getSubscriptionList(tenantId); }

  @Get('payments')
  getPayments(@Query('status') status?: string, @Query('search') search?: string, @Query('page') page?: string) {
    return this.adminService.getSubscriptionPayments({ status, search, page });
  }

  @Get('audit-logs')
  getAuditLogs(@Query('search') search?: string, @Query('page') page?: string) { return this.adminService.getAuditLogs({ search, page }); }

  @Get('settings')
  getSettings() { return this.adminService.getSafeSettings(); }

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

  @Get('users')
  @ApiOperation({ summary: 'List all platform users across merchants, staff, and customers' })
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string
  ) {
    return this.adminService.getUsers(search, role);
  }

  @Post('users/:id/toggle-status')
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  async toggleUserStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.adminService.toggleUserStatus(id, user.userId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Platform SaaS analytics, revenue metrics, and top stores' })
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('plans')
  @ApiOperation({ summary: 'List all SaaS subscription tiers with subscriber counts' })
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new SaaS subscription tier' })
  async createPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any
  ) {
    return this.adminService.createPlan(body, user.userId);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update an existing SaaS subscription tier' })
  async updatePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.adminService.updatePlan(id, body, user.userId);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete or archive a SaaS subscription tier' })
  async deletePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.adminService.deletePlan(id, user.userId);
  }
}
