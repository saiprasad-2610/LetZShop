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
import { Roles, CurrentUser } from '../../common/decorators';
import { AuthenticatedUser, UserRole } from '@simply/types';
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

  @Get('subscriptions')
  getSubscriptions(@Query() query: import('./admin-data.service').AdminQuery) {
    return this.adminService.getSubscriptionList(query);
  }

  @Get('subscriptions/kpis')
  @ApiOperation({ summary: 'Get SaaS subscription operational KPIs' })
  getSubscriptionKpis() {
    return this.adminService.getSubscriptionKpis();
  }

  @Get('subscriptions/:id')
  @ApiOperation({ summary: 'Get subscription detail including invoices and events' })
  getSubscriptionDetail(@Param('id') id: string) {
    return this.adminService.getSubscriptionDetail(id);
  }

  @Patch('subscriptions/:id/plan')
  @ApiOperation({ summary: 'Change merchant subscription plan' })
  changeSubscriptionPlan(
    @Param('id') id: string,
    @Body() body: { planId: string; reason: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.changeSubscriptionPlan(id, body.planId, body.reason, user.userId);
  }

  @Patch('subscriptions/:id/expiry')
  @ApiOperation({ summary: 'Extend or adjust merchant subscription expiry' })
  extendSubscriptionExpiry(
    @Param('id') id: string,
    @Body() body: { newEnd: string; reason: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.extendSubscriptionExpiry(id, new Date(body.newEnd), body.reason, user.userId);
  }

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

  @Get('payments')
  getPayments(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
  ) {
    return this.adminService.getSubscriptionPayments({ status, search, page });
  }

  @Get('audit-logs')
  getAuditLogs(@Query('search') search?: string, @Query('page') page?: string) {
    return this.adminService.getAuditLogs({ search, page });
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSafeSettings();
  }

  @Get('overview')
  @ApiOperation({ summary: 'Platform-wide operational overview & metrics' })
  async getOverview(
    @Query('range') range?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getOverview(range, from, to);
  }

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

  @Get('merchants')
  @ApiOperation({
    summary: 'List all platform merchants with store & subscription status',
  })
  async getMerchants(
    @Query() query: import('./admin-data.service').AdminQuery,
  ) {
    return this.adminService.getMerchants(query);
  }

  @Get('merchants/:id')
  @ApiOperation({
    summary: 'Get full merchant detail, stores, and subscriptions',
  })
  async getMerchantById(@Param('id') id: string) {
    return this.adminService.getMerchantById(id);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Download subscription invoice as official PDF' })
  async getInvoicePdf(@Param('id') id: string, @Res() res: any) {
    const pdf = await this.adminService.generateInvoicePdf(id);
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `inline; filename="invoice-${id}.pdf"`);
    res.header('Cache-Control', 'no-store');
    return res.send(pdf);
  }

  @Post('merchants/:id/suspend')
  @ApiOperation({ summary: 'Suspend merchant access with audit logging' })
  async suspendMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.adminService.suspendMerchant(id, user.userId, body);
  }

  @Post('merchants/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate suspended merchant with audit logging' })
  async reactivateMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.adminService.reactivateMerchant(id, user.userId, body);
  }

  @Post('merchants/:id/archive')
  @ApiOperation({ summary: 'Archive merchant with data preservation and audit logging' })
  async archiveMerchant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.adminService.archiveMerchant(id, user.userId, body);
  }

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

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'private, no-store');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
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

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'private, no-store');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
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

  @Get('users')
  @ApiOperation({
    summary: 'List all platform users across merchants, staff, and customers',
  })
  async getUsers(@Query() query: import('./admin-data.service').AdminQuery) {
    return this.adminService.getUsers(query);
  }

  @Post('users/:id/toggle-status')
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  async toggleUserStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.adminService.toggleUserStatus(id, user.userId);
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
