import { CreateAdminPlanDto, UpdateAdminPlanDto } from './admin-plan.dto';
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser, RequirePermission } from '../../common/decorators';
import { AuthenticatedUser, UserRole, AdminPermission } from '@simply/types';
import { CreateSubAdminDto, UpdateSubAdminDto } from '@simply/api-contracts';
import * as fs from 'fs';

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

  @RequirePermission(AdminPermission.SUBSCRIPTIONS_VIEW)
  @Get('subscriptions')
  getSubscriptions(@Query() query: import('./admin-data.service').AdminQuery) {
    return this.adminService.getSubscriptionList(query);
  }

  @RequirePermission(AdminPermission.SUBSCRIPTIONS_VIEW)
  @Get('subscriptions/kpis')
  @ApiOperation({ summary: 'Get SaaS subscription operational KPIs' })
  getSubscriptionKpis() {
    return this.adminService.getSubscriptionKpis();
  }

  @RequirePermission(AdminPermission.SUBSCRIPTIONS_VIEW)
  @Get('subscriptions/:id')
  @ApiOperation({ summary: 'Get subscription detail including invoices and events' })
  getSubscriptionDetail(@Param('id') id: string) {
    return this.adminService.getSubscriptionDetail(id);
  }

  @RequirePermission(AdminPermission.SUBSCRIPTIONS_MANAGE)
  @Patch('subscriptions/:id/plan')
  @ApiOperation({ summary: 'Change merchant subscription plan' })
  changeSubscriptionPlan(
    @Param('id') id: string,
    @Body() body: { planId: string; reason: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.changeSubscriptionPlan(id, body.planId, body.reason, user.userId);
  }

  @RequirePermission(AdminPermission.SUBSCRIPTIONS_MANAGE)
  @Patch('subscriptions/:id/expiry')
  @ApiOperation({ summary: 'Extend or adjust merchant subscription expiry' })
  extendSubscriptionExpiry(
    @Param('id') id: string,
    @Body() body: { newEnd: string; reason: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.extendSubscriptionExpiry(id, new Date(body.newEnd), body.reason, user.userId);
  }

  @RequirePermission(AdminPermission.SUBSCRIPTIONS_MANAGE)
  @Post('subscriptions/:id/cancel')
  @ApiOperation({ summary: 'Cancel merchant subscription' })
  cancelSubscription(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.cancelSubscription(id, body.reason, user.userId);
  }

  @Get('themes')
  getThemes() {
    return this.adminService.getThemes();
  }

  @RequirePermission(AdminPermission.PAYMENTS_VIEW)
  @Get('payments')
  @ApiOperation({ summary: 'Paginated subscription payments with search, filters, and KPIs' })
  getPayments(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('planId') planId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('gateway') gateway?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('range') range?: string,
    @Query('sort') sort?: string,
  ) {
    return this.adminService.getSubscriptionPayments({
      status,
      search,
      page,
      pageSize,
      planId,
      tenantId,
      gateway,
      from,
      to,
      range,
      sort,
    });
  }

  @RequirePermission(AdminPermission.PAYMENTS_RECONCILE)
  @Post('payments/:id/reconcile')
  @ApiOperation({ summary: 'Reconcile subscription payment against gateway with audit trail' })
  async reconcileSubscriptionPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.adminService.reconcileSubscriptionPayment(id, user.userId);
  }

  @RequirePermission(AdminPermission.AUDIT_LOGS_VIEW)
  @Get('audit-logs')
  getAuditLogs(@Query('search') search?: string, @Query('page') page?: string) {
    return this.adminService.getAuditLogs({ search, page });
  }

  @RequirePermission(AdminPermission.SETTINGS_VIEW)
  @Get('settings')
  getSettings() {
    return this.adminService.getSafeSettings();
  }

  @RequirePermission(AdminPermission.SETTINGS_MANAGE)
  @Put('settings/:category')
  @ApiOperation({ summary: 'Update platform settings by category with database persistence' })
  async updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Param('category') category: string,
    @Body() body: any,
  ) {
    return this.adminService.updateSettings(category, body, user.userId);
  }

  @RequirePermission(AdminPermission.SETTINGS_MANAGE)
  @Post('settings/test-smtp')
  @ApiOperation({ summary: 'Test outgoing platform SMTP connection' })
  async testSmtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { targetEmail: string },
  ) {
    return this.adminService.testSmtpConnection(body.targetEmail, user.userId);
  }

  @RequirePermission(AdminPermission.DASHBOARD_VIEW)
  @Get('overview')
  @ApiOperation({ summary: 'Platform-wide operational overview & metrics' })
  async getOverview(
    @Query('range') range?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getOverview(range, from, to);
  }

  @RequirePermission(AdminPermission.DASHBOARD_VIEW)
  @Get('attention-summary')
  @ApiOperation({ summary: 'Platform actionable attention counts and badges' })
  async getAttentionSummary() {
    return this.adminService.getAttentionSummary();
  }

  @Get('orders')
  @ApiOperation({ summary: 'List platform orders with pagination' })
  async getOrders(@Query() query: import('./admin-data.service').AdminQuery) {
    return this.adminService.getCommerceMonitoring(query);
  }

  @RequirePermission(AdminPermission.MERCHANTS_VIEW)
  @Get('merchants')
  @ApiOperation({
    summary: 'List all platform merchants with store & subscription status',
  })
  async getMerchants(
    @Query() query: import('./admin-data.service').AdminQuery,
  ) {
    return this.adminService.getMerchants(query);
  }

  @RequirePermission(AdminPermission.MERCHANTS_VIEW)
  @Get('merchants/:id')
  @ApiOperation({
    summary: 'Get full merchant detail, stores, and subscriptions',
  })
  async getMerchantById(@Param('id') id: string) {
    return this.adminService.getMerchantById(id);
  }

  @RequirePermission(AdminPermission.PAYMENTS_VIEW)
  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Download subscription invoice as official PDF' })
  async getInvoicePdf(@Param('id') id: string, @Res() res: any) {
    const pdf = await this.adminService.generateInvoicePdf(id);
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `inline; filename="LetzShop-Invoice-${id}.pdf"`);
    res.header('Cache-Control', 'private, no-store');
    return res.send(pdf);
  }

  @RequirePermission(AdminPermission.MERCHANTS_SUSPEND)
  @Post('merchants/:id/suspend')
  @ApiOperation({ summary: 'Suspend merchant access with audit logging' })
  async suspendMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.adminService.suspendMerchant(id, user.userId, body);
  }

  @RequirePermission(AdminPermission.MERCHANTS_SUSPEND)
  @Post('merchants/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate suspended merchant with audit logging' })
  async reactivateMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.adminService.reactivateMerchant(id, user.userId, body);
  }

  @RequirePermission(AdminPermission.MERCHANTS_SUSPEND)
  @Post('merchants/:id/archive')
  @ApiOperation({ summary: 'Archive merchant with data preservation and audit logging' })
  async archiveMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.adminService.archiveMerchant(id, user.userId, body);
  }

  @RequirePermission(AdminPermission.MERCHANTS_CONTACT)
  @Post('merchants/:id/message')
  @ApiOperation({ summary: 'Send email or prepare WhatsApp message to merchant' })
  async sendMessageToMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { channels: Array<'EMAIL' | 'WHATSAPP'>; subject: string; message: string },
  ) {
    return this.adminService.sendMessageToMerchant(id, user.userId, body);
  }

  @Get('merchants/:id/communication-history')
  @ApiOperation({ summary: 'Retrieve communication audit history for a merchant' })
  async getCommunicationHistory(@Param('id') id: string) {
    return this.adminService.getCommunicationHistory(id);
  }

  @Get('merchants/:id/communications')
  @ApiOperation({ summary: 'Paginated communication history for a merchant' })
  async getMerchantCommunications(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getMerchantCommunications(id, page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 5);
  }

  @Get('merchants/:id/subscriptions')
  @ApiOperation({ summary: 'Paginated subscription history for a merchant' })
  async getMerchantSubscriptions(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getMerchantSubscriptions(id, page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 5);
  }

  @Get('merchants/:id/invoices')
  @ApiOperation({ summary: 'Paginated invoice history for a merchant' })
  async getMerchantInvoices(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getMerchantInvoices(id, page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 5);
  }

  @Get('merchants/:id/orders')
  @ApiOperation({ summary: 'Paginated orders for a merchant' })
  async getMerchantOrders(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getMerchantOrders(id, page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 5);
  }

  @Get('merchants/:id/moderation-summary')
  @ApiOperation({ summary: 'Review & moderation summary with paginated activity for a merchant' })
  async getMerchantModerationSummary(
    @Param('id') id: string,
    @Query('reviewPage') reviewPage?: string,
    @Query('statusPage') statusPage?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getMerchantModerationSummary(
      id,
      reviewPage ? parseInt(reviewPage, 10) : 1,
      statusPage ? parseInt(statusPage, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 5,
    );
  }

  @Get('merchants/:id/verification')
  @ApiOperation({ summary: 'Get business verification status and documents for a merchant' })
  async getMerchantVerification(@Param('id') id: string) {
    return this.adminService.getMerchantVerification(id);
  }

  @Post('merchants/:id/documents/:docId/review')
  @ApiOperation({ summary: 'Verify or reject a merchant business document' })
  async reviewMerchantDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Body() body: { status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string; adminNote?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.reviewMerchantDocument(user.userId, id, docId, body);
  }

  @Get('merchants/:id/documents/:docId/download')
  @ApiOperation({ summary: 'Securely download merchant business document' })
  async downloadMerchantDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Res() res: any,
  ) {
    const { filePath, mimeType, filename } =
      await this.adminService.getMerchantDocumentStream(docId, id);

    res.header('Content-Type', mimeType);
    res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.header('Cache-Control', 'private, no-store');

    const stream = fs.createReadStream(filePath);
    return res.send(stream);
  }

  @Get('merchants/:id/documents/:docId/view')
  @ApiOperation({ summary: 'Securely preview merchant business document inline' })
  async viewMerchantDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Res() res: any,
  ) {
    const { filePath, mimeType, filename } =
      await this.adminService.getMerchantDocumentStream(docId, id);

    res.header('Content-Type', mimeType);
    res.header('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.header('Cache-Control', 'private, no-store');

    const stream = fs.createReadStream(filePath);
    return res.send(stream);
  }

  @Get('commerce')
  @ApiOperation({
    summary:
      'Cross-platform operational monitoring for orders, payments, refunds',
  })
  async getCommerceMonitoring(
    @Query() query: import('./admin-data.service').AdminQuery,
  ) {
    return this.adminService.getCommerceMonitoring(query);
  }

  @Get('operations')
  @ApiOperation({
    summary: 'Operational health, failed outbox events, and audit trail',
  })
  async getOperationsSummary() {
    return this.adminService.getOperationsSummary();
  }

  @Post('operations/retry-outbox/:id')
  @ApiOperation({ summary: 'Retry a failed outbox event with audit trail' })
  async retryOutboxEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.adminService.retryOutboxEvent(id, user.userId);
  }

  @Post('operations/reconcile-payment/:id')
  @ApiOperation({
    summary: 'Reconcile payment order against gateway with audit trail',
  })
  async reconcilePaymentOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.adminService.reconcilePaymentOrder(id, user.userId);
  }

  @RequirePermission(AdminPermission.USERS_VIEW)
  @Get('users')
  @ApiOperation({
    summary: 'List all platform users across merchants, staff, and customers',
  })
  async getUsers(@Query() query: import('./admin-data.service').AdminQuery) {
    return this.adminService.getUsers(query);
  }

  @RequirePermission(AdminPermission.USERS_MANAGE)
  @Post('users/:id/toggle-status')
  @ApiOperation({ summary: 'Activate or deactivate a user account with audit logging' })
  async toggleUserStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body?: { reason?: string; internalNote?: string },
  ) {
    return this.adminService.toggleUserStatus(id, user.userId, body);
  }

  // ============================================================================
  // SUB ADMIN MANAGEMENT
  // ============================================================================

  @RequirePermission(AdminPermission.SUB_ADMINS_MANAGE)
  @Get('sub-admins')
  @ApiOperation({ summary: 'List delegated platform administrators and pending invitations' })
  async getSubAdmins(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getSubAdmins({ search, status, page, pageSize });
  }

  @RequirePermission(AdminPermission.SUB_ADMINS_MANAGE)
  @Post('sub-admins')
  @ApiOperation({ summary: 'Invite a new delegated platform administrator' })
  async createSubAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateSubAdminDto,
  ) {
    return this.adminService.createSubAdmin(body, user.userId);
  }

  @RequirePermission(AdminPermission.SUB_ADMINS_MANAGE)
  @Put('sub-admins/:id')
  @ApiOperation({ summary: 'Update delegated administrator permissions and details' })
  async updateSubAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateSubAdminDto,
  ) {
    return this.adminService.updateSubAdmin(id, body, user.userId);
  }

  @RequirePermission(AdminPermission.SUB_ADMINS_MANAGE)
  @Post('sub-admins/:id/toggle-status')
  @ApiOperation({ summary: 'Suspend or reactivate a delegated administrator account' })
  async toggleSubAdminStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body?: { reason?: string },
  ) {
    return this.adminService.toggleSubAdminStatus(id, user.userId, body);
  }

  @RequirePermission(AdminPermission.SUB_ADMINS_MANAGE)
  @Post('sub-admins/invites/:id/resend')
  @ApiOperation({ summary: 'Resend invitation email with fresh activation token' })
  async resendSubAdminInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.adminService.resendSubAdminInvite(id, user.userId);
  }

  @RequirePermission(AdminPermission.SUB_ADMINS_MANAGE)
  @Post('sub-admins/:id/revoke-sessions')
  @ApiOperation({ summary: 'Revoke active sessions for a delegated administrator' })
  async revokeSubAdminSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.adminService.revokeSubAdminSessions(id, user.userId);
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Platform SaaS analytics, revenue metrics, and top stores',
  })
  async getAnalytics(@Query('range') range?: string) {
    return this.adminService.getAnalytics(range);
  }

  @Get('plans')
  @ApiOperation({
    summary: 'List all SaaS subscription tiers with subscriber counts',
  })
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new SaaS subscription tier' })
  async createPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAdminPlanDto,
  ) {
    return this.adminService.createPlan(body, user.userId);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update an existing SaaS subscription tier' })
  async updatePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateAdminPlanDto,
  ) {
    return this.adminService.updatePlan(id, body, user.userId);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete or archive a SaaS subscription tier' })
  async deletePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.adminService.deletePlan(id, user.userId);
  }
}
