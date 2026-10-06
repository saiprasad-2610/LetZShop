import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaClient, OrderStatus, ProductStatus, StoreStatus } from '@prisma/client';
import { StoreSubscriptionRequiredException } from '../../common/exceptions/domain.exceptions';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, CurrentUser } from '../../common/decorators';
import { AuthenticatedUser, TenantContext } from '@simply/types';
import { StoresService } from '../stores/stores.service';
import { CatalogService } from '../catalog/catalog.service';
import { ThemesService } from '../themes/themes.service';
import { OrdersService } from '../orders/orders.service';
import { MediaService } from '../media/media.service';
import { CreateProductDto } from '../catalog/dto/catalog.dto';

import { DashboardService } from './dashboard.service';

@ApiTags('Seller Dashboard & Merchant APIs')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('seller')
export class SellerController {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storesService: StoresService,
    private readonly catalogService: CatalogService,
    private readonly themesService: ThemesService,
    private readonly ordersService: OrdersService,
    private readonly mediaService: MediaService,
    private readonly dashboardService: DashboardService
  ) {}

  // ============================================================================
  // SELLER IDENTITY & BUSINESS
  // ============================================================================

  @Get('me')
  @ApiOperation({ summary: 'Get current seller user profile & active memberships' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        memberships: {
          include: { tenant: { include: { stores: true } } },
        },
        credentials: { select: { credentialType: true, createdAt: true } },
      },
    });
    return { user: profile };
  }

  @Get('business')
  @ApiOperation({ summary: 'Get merchant business/tenant details & subscription status' })
  async getBusiness(@CurrentTenant() tenant: TenantContext) {
    const business = await this.prisma.tenant.findUnique({
      where: { id: tenant.tenantId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!business) throw new NotFoundException('Business not found.');
    return business;
  }

  @Patch('business')
  @ApiOperation({ summary: 'Update business name and details' })
  async updateBusiness(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { name?: string }
  ) {
    return this.prisma.tenant.update({
      where: { id: tenant.tenantId },
      data: {
        ...(body.name ? { name: body.name } : {}),
      },
    });
  }

  @Get('store')
  @ApiOperation({ summary: 'Get current seller store settings and branding' })
  async getStore(@CurrentTenant() tenant: TenantContext) {
    return this.storesService.getStoreByTenantId(tenant.tenantId);
  }

  @Patch('store')
  @ApiOperation({ summary: 'Update store configuration, description, contact details, or timezone' })
  async updateStore(
    @CurrentTenant() tenant: TenantContext,
    @Body()
    body: {
      name?: string;
      description?: string;
      timezone?: string;
      supportPhone?: string;
      supportEmail?: string;
      whatsappNumber?: string;
      businessAddress?: string;
      mapsUrl?: string;
      socialLinks?: any;
      fulfillmentMode?: any;
    }
  ) {
    return this.prisma.store.update({
      where: { id: tenant.storeId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.timezone ? { timezone: body.timezone } : {}),
        ...(body.supportPhone !== undefined ? { supportPhone: body.supportPhone } : {}),
        ...(body.supportEmail !== undefined ? { supportEmail: body.supportEmail } : {}),
        ...(body.whatsappNumber !== undefined ? { whatsappNumber: body.whatsappNumber } : {}),
        ...(body.businessAddress !== undefined ? { businessAddress: body.businessAddress } : {}),
        ...(body.mapsUrl !== undefined ? { mapsUrl: body.mapsUrl } : {}),
        ...(body.socialLinks !== undefined ? { socialLinks: body.socialLinks } : {}),
        ...(body.fulfillmentMode ? { fulfillmentMode: body.fulfillmentMode } : {}),
      },
    });
  }

  @Post('store/publish')
  @ApiOperation({ summary: 'Publish store to live status (subscription gated)' })
  async publishStore(@CurrentTenant() tenant: TenantContext) {
    const activeSub = await this.prisma.subscription.findFirst({
      where: {
        tenantId: tenant.tenantId,
        status: 'ACTIVE',
        currentPeriodEnd: { gt: new Date() },
      },
    });
    if (!activeSub) {
      throw new StoreSubscriptionRequiredException(
        'Storefront cannot be published without an active paid subscription.'
      );
    }
    return this.prisma.store.update({
      where: { id: tenant.storeId },
      data: {
        status: StoreStatus.LIVE,
        isPubliclyAccessible: true,
      },
    });
  }

  @Post('store/unpublish')
  @ApiOperation({ summary: 'Unpublish store to private preview status' })
  async unpublishStore(@CurrentTenant() tenant: TenantContext) {
    return this.prisma.store.update({
      where: { id: tenant.storeId },
      data: {
        status: StoreStatus.PRIVATE_PREVIEW,
        isPubliclyAccessible: false,
      },
    });
  }

  @Get('store/business-hours')
  @ApiOperation({ summary: 'Get store business hours' })
  async getBusinessHours(@CurrentTenant() tenant: TenantContext) {
    return this.prisma.storeBusinessHours.findMany({
      where: { storeId: tenant.storeId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  @Put('store/business-hours')
  @ApiOperation({ summary: 'Update or set weekly store business hours' })
  async updateBusinessHours(
    @CurrentTenant() tenant: TenantContext,
    @Body()
    body: {
      hours: Array<{
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        isClosed: boolean;
      }>;
    }
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.storeBusinessHours.deleteMany({
        where: { storeId: tenant.storeId },
      });
      if (body.hours && body.hours.length > 0) {
        await tx.storeBusinessHours.createMany({
          data: body.hours.map((h) => ({
            storeId: tenant.storeId,
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed || false,
          })),
        });
      }
      return tx.storeBusinessHours.findMany({
        where: { storeId: tenant.storeId },
        orderBy: { dayOfWeek: 'asc' },
      });
    });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive business metrics and analytics for merchant dashboard' })
  async getDashboard(
    @CurrentTenant() tenant: TenantContext,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.dashboardService.getDashboardAnalytics(tenant.tenantId, tenant.storeId, {
      period,
      startDate,
      endDate,
    });
  }

  // ============================================================================
  // CATALOG: CATEGORIES, PRODUCTS & VARIANTS
  // ============================================================================

  @Get('categories')
  @ApiOperation({ summary: 'List categories for merchant store' })
  async getCategories(@CurrentTenant() tenant: TenantContext) {
    return this.catalogService.getCategories(tenant);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new category' })
  async createCategory(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { name: string; description?: string; imageUrl?: string }
  ) {
    return this.catalogService.createCategory(tenant, body);
  }

  @Get('products')
  @ApiOperation({ summary: 'List products for merchant store' })
  async getProducts(
    @CurrentTenant() tenant: TenantContext,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.catalogService.getProducts(tenant, { search, categoryId, page, limit });
  }

  @Post('products')
  @ApiOperation({ summary: 'Create product with options, variants, and stock' })
  async createProduct(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto
  ) {
    return this.catalogService.createProduct(tenant, dto, user.userId);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  async getProductById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string
  ) {
    return this.catalogService.getProductById(tenant, id);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product details, options, and variants' })
  async updateProduct(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>
  ) {
    return this.catalogService.updateProduct(tenant, id, dto, user.userId);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete / archive product' })
  async deleteProduct(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.catalogService.deleteProduct(tenant, id, user.userId);
  }

  @Post('products/:id/documents')
  @ApiOperation({ summary: 'Attach a product document (datasheet, brochure, manual, drawing, certificate)' })
  async addProductDocument(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      docType?: string;
      fileUrl: string;
      fileSizeMb?: number;
      mediaAssetId?: string;
      sortOrder?: number;
    }
  ) {
    return this.catalogService.addProductDocument(tenant, id, body);
  }

  @Delete('products/:id/documents/:docId')
  @ApiOperation({ summary: 'Remove a product document' })
  async removeProductDocument(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Param('docId') docId: string
  ) {
    return this.catalogService.removeProductDocument(tenant, id, docId);
  }

  @Get('variants/:id')
  @ApiOperation({ summary: 'Get variant details and inventory' })
  async getVariant(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string
  ) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id, storeId: tenant.storeId },
      include: {
        inventory: true,
        optionValues: { include: { optionValue: true } },
        product: true,
      },
    });
    if (!variant) throw new NotFoundException('Variant not found.');
    return variant;
  }

  @Patch('variants/:id')
  @ApiOperation({ summary: 'Update variant price, SKU, dimensions, or status' })
  async updateVariant(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body()
    body: {
      pricePaise?: number;
      compareAtPricePaise?: number;
      sku?: string;
      barcode?: string;
      weightGrams?: number;
      lengthCm?: number;
      widthCm?: number;
      heightCm?: number;
      status?: any;
    }
  ) {
    const existing = await this.prisma.productVariant.findFirst({
      where: { id, storeId: tenant.storeId },
    });
    if (!existing) throw new NotFoundException('Variant not found.');

    return this.prisma.productVariant.update({
      where: { id },
      data: {
        ...(body.pricePaise !== undefined ? { pricePaise: body.pricePaise } : {}),
        ...(body.compareAtPricePaise !== undefined ? { compareAtPricePaise: body.compareAtPricePaise } : {}),
        ...(body.sku ? { sku: body.sku } : {}),
        ...(body.barcode !== undefined ? { barcode: body.barcode } : {}),
        ...(body.weightGrams !== undefined ? { weightGrams: body.weightGrams } : {}),
        ...(body.lengthCm !== undefined ? { lengthCm: body.lengthCm } : {}),
        ...(body.widthCm !== undefined ? { widthCm: body.widthCm } : {}),
        ...(body.heightCm !== undefined ? { heightCm: body.heightCm } : {}),
        ...(body.status ? { status: body.status } : {}),
      },
    });
  }

  // ============================================================================
  // MEDIA
  // ============================================================================

  @Get('media')
  @ApiOperation({ summary: 'List media assets for merchant tenant' })
  async getMedia(
    @CurrentTenant() tenant: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const p = Math.max(1, page || 1);
    const l = Math.min(50, Math.max(1, limit || 20));
    const skip = (p - 1) * l;

    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where: { tenantId: tenant.tenantId },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mediaAsset.count({ where: { tenantId: tenant.tenantId } }),
    ]);

    return { items, total, page: p, limit: l, hasMore: skip + items.length < total };
  }

  // ============================================================================
  // THEMES & STORE SECTIONS
  // ============================================================================

  @Get('themes')
  @ApiOperation({ summary: 'List all foundational themes' })
  async getThemes() {
    return this.themesService.getAvailableThemes();
  }

  @Get('store/theme')
  @ApiOperation({ summary: 'Get current store theme configuration' })
  async getStoreTheme(@CurrentTenant() tenant: TenantContext) {
    return this.themesService.getStoreThemeConfig(tenant);
  }

  @Put('store/theme')
  @ApiOperation({ summary: 'Update theme, design tokens, and branding' })
  async updateStoreTheme(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: any
  ) {
    return this.themesService.updateStoreThemeConfig(tenant, body);
  }

  @Put('store/sections')
  @ApiOperation({ summary: 'Reorder, enable/disable, and configure homepage store sections' })
  async updateStoreSections(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { sections: any[] }
  ) {
    return this.themesService.updateStoreThemeConfig(tenant, { sections: body.sections });
  }

  // ============================================================================
  // ORDERS & BUSINESS STATE TRANSITIONS
  // ============================================================================

  @Get('orders')
  @ApiOperation({ summary: 'List merchant orders with search, filters, and pagination' })
  async getOrders(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: any
  ) {
    return this.ordersService.getOrders(tenant, query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get full order details strictly scoped to current tenant' })
  async getOrderById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string
  ) {
    return this.ordersService.getOrderById(id, tenant);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status with canonical transition validation (PATCH)' })
  async updateOrderStatus(
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
      user.userId,
      true
    );
  }

  @Post('orders/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition order from NEW to CONFIRMED' })
  async confirmOrder(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      OrderStatus.CONFIRMED,
      tenant,
      'Order confirmed by merchant.',
      user.userId
    );
  }

  @Post('orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order and release reserved stock' })
  async cancelOrder(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason?: string
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      OrderStatus.CANCELLED,
      tenant,
      reason || 'Order cancelled by merchant.',
      user.userId
    );
  }

  @Post('orders/:id/fulfill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark order dispatched / ready for logistics' })
  async fulfillOrder(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      OrderStatus.DISPATCHED,
      tenant,
      'Order dispatched for delivery.',
      user.userId
    );
  }

  @Post('orders/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark order completed upon confirmed delivery' })
  async completeOrder(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      OrderStatus.COMPLETED,
      tenant,
      'Order completed and settled.',
      user.userId
    );
  }
}
