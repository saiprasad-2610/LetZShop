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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaClient, OrderStatus, ProductStatus, StoreStatus, ShippingProviderType } from '@prisma/client';
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
import { ShiprocketShippingProvider } from '../shipping/providers/shiprocket-shipping.provider';

import { DashboardService } from './dashboard.service';
import { ReportsService } from './reports.service';
import { isValidLocale, sanitizeLocale, SUPPORTED_LOCALES } from '@simply/i18n';

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
    private readonly dashboardService: DashboardService,
    private readonly reportsService: ReportsService,
    private readonly shiprocketProvider: ShiprocketShippingProvider
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

  @Patch('preferences')
  @ApiOperation({ summary: 'Update merchant user preferences (e.g. preferredLocale)' })
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { preferredLocale?: string }
  ) {
    if (body.preferredLocale && !isValidLocale(body.preferredLocale)) {
      throw new BadRequestException(`Invalid locale specified. Must be one of: ${SUPPORTED_LOCALES.join(', ')}`);
    }
    const updated = await this.prisma.user.update({
      where: { id: user.userId },
      data: {
        ...(body.preferredLocale ? { preferredLocale: sanitizeLocale(body.preferredLocale) } : {}),
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        preferredLocale: true,
      },
    });
    return { success: true, user: updated, preferredLocale: updated.preferredLocale };
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
      storefrontDefaultLocale?: string;
      enabledStorefrontLocales?: string[];
    }
  ) {
    if (body.storefrontDefaultLocale && !isValidLocale(body.storefrontDefaultLocale)) {
      throw new BadRequestException(`Invalid storefront default locale. Must be one of: ${SUPPORTED_LOCALES.join(', ')}`);
    }

    if (body.enabledStorefrontLocales) {
      if (!Array.isArray(body.enabledStorefrontLocales) || body.enabledStorefrontLocales.length === 0) {
        throw new BadRequestException('At least one storefront language must be enabled.');
      }
      for (const loc of body.enabledStorefrontLocales) {
        if (!isValidLocale(loc)) {
          throw new BadRequestException(`Invalid locale '${loc}' in enabledStorefrontLocales list.`);
        }
      }
    }

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
        ...(body.storefrontDefaultLocale ? { storefrontDefaultLocale: sanitizeLocale(body.storefrontDefaultLocale) } : {}),
        ...(body.enabledStorefrontLocales ? { enabledStorefrontLocales: body.enabledStorefrontLocales.map((l) => sanitizeLocale(l)) } : {}),
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

  @Get('reports')
  @ApiOperation({ summary: 'Get merchant customized report data (sales, orders, products, customers)' })
  async getReports(
    @CurrentTenant() tenant: TenantContext,
    @Query('type') type?: 'sales' | 'orders' | 'products' | 'customers',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string
  ) {
    return this.reportsService.getReportData(tenant, {
      type,
      startDate,
      endDate,
      status,
      paymentStatus,
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
    @Body()
    body: {
      status: OrderStatus;
      reason?: string;
      customMessage?: string;
      riderName?: string;
      riderPhone?: string;
      riderEmail?: string;
    }
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      body.status,
      tenant,
      body.reason,
      user.userId,
      true,
      body.customMessage,
      body.riderName,
      body.riderPhone,
      body.riderEmail
    );
  }

  // ============================================================================
  // DELIVERY PARTNERS / RIDERS DIRECTORY
  // ============================================================================

  @Get('delivery-partners')
  @ApiOperation({ summary: 'Get list of configured delivery partners / riders for the store' })
  async getDeliveryPartners(@CurrentTenant() tenant: TenantContext) {
    const store = await this.prisma.store.findUnique({
      where: { id: tenant.storeId },
      select: { socialLinks: true },
    });
    const social = (store?.socialLinks as any) || {};
    const partners = Array.isArray(social.deliveryPartners) ? social.deliveryPartners : [];
    return { success: true, data: partners };
  }

  @Post('delivery-partners')
  @ApiOperation({ summary: 'Add or update a delivery partner in the store directory' })
  async saveDeliveryPartner(
    @CurrentTenant() tenant: TenantContext,
    @Body()
    body: {
      id?: string;
      name: string;
      phone: string;
      email?: string;
      vehicle?: string;
      notes?: string;
      isDefault?: boolean;
    }
  ) {
    if (!body.name || !body.phone) {
      throw new BadRequestException('Delivery partner name and phone are required.');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: tenant.storeId },
      select: { socialLinks: true },
    });
    const social = (store?.socialLinks as any) || {};
    let partners: any[] = Array.isArray(social.deliveryPartners) ? [...social.deliveryPartners] : [];

    const partnerId = body.id || `rider_${Date.now()}`;
    const cleanPhone = body.phone.replace(/[^0-9]/g, '');

    const partnerObj = {
      id: partnerId,
      name: body.name.trim(),
      phone: cleanPhone,
      email: body.email?.trim() || '',
      vehicle: body.vehicle?.trim() || 'Motorcycle',
      notes: body.notes?.trim() || '',
      isDefault: Boolean(body.isDefault),
      updatedAt: new Date().toISOString(),
    };

    if (body.isDefault) {
      partners = partners.map((p) => ({ ...p, isDefault: false }));
    }

    const existingIdx = partners.findIndex((p) => p.id === partnerId);
    if (existingIdx >= 0) {
      partners[existingIdx] = partnerObj;
    } else {
      partners.push(partnerObj);
    }

    await this.prisma.store.update({
      where: { id: tenant.storeId },
      data: {
        socialLinks: {
          ...social,
          deliveryPartners: partners,
        },
      },
    });

    return { success: true, data: partnerObj, all: partners };
  }

  @Delete('delivery-partners/:id')
  @ApiOperation({ summary: 'Delete a delivery partner from the store directory' })
  async deleteDeliveryPartner(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string
  ) {
    const store = await this.prisma.store.findUnique({
      where: { id: tenant.storeId },
      select: { socialLinks: true },
    });
    const social = (store?.socialLinks as any) || {};
    let partners: any[] = Array.isArray(social.deliveryPartners) ? [...social.deliveryPartners] : [];

    partners = partners.filter((p) => p.id !== id);

    await this.prisma.store.update({
      where: { id: tenant.storeId },
      data: {
        socialLinks: {
          ...social,
          deliveryPartners: partners,
        },
      },
    });

    return { success: true, data: partners };
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

  @Post('orders/:id/collect-cod')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark COD payment as collected by merchant with actual collection method' })
  async collectCodPayment(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { collectionMethod?: string; amountPaise?: number; note?: string }
  ) {
    return this.ordersService.collectCodPayment(id, tenant, body, user.userId);
  }

  // ============================================================================
  // RAZORPAY PAYMENT SETTINGS
  // ============================================================================

  @Get('payment-settings')
  @ApiOperation({ summary: 'Get merchant Razorpay payment account configuration status' })
  async getPaymentSettings(@CurrentTenant() tenant: TenantContext) {
    let storeId: string | undefined = tenant?.storeId;
    if (!storeId && tenant?.tenantId) {
      const store = await this.prisma.store.findFirst({
        where: { tenantId: tenant.tenantId, deletedAt: null },
      });
      if (store?.id) storeId = store.id;
    }

    const account = storeId
      ? await this.prisma.merchantPaymentAccount.findFirst({
          where: { storeId, provider: 'RAZORPAY' },
        })
      : null;

    const capabilities = (account?.capabilities as any) || {};
    const codEnabled = capabilities.codEnabled !== false;

    if (!account) {
      return {
        connected: false,
        provider: 'RAZORPAY',
        keyId: null,
        isEnabled: false,
        codEnabled,
        secretConfigured: false,
      };
    }

    const isConnected = Boolean(
      account.keyId &&
      account.keyId !== 'pending_setup' &&
      account.keySecretEncrypted &&
      account.keySecretEncrypted !== 'pending_setup' &&
      account.isEnabled !== false
    );

    return {
      connected: isConnected,
      provider: 'RAZORPAY',
      keyId: account.keyId === 'pending_setup' ? null : account.keyId,
      isEnabled: account.isEnabled,
      codEnabled,
      secretConfigured: Boolean(account.keySecretEncrypted && account.keySecretEncrypted !== 'pending_setup'),
    };
  }

  @Post('payment-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save or update merchant Razorpay Key ID and Key Secret' })
  async savePaymentSettings(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { keyId: string; keySecret: string; isEnabled?: boolean; codEnabled?: boolean }
  ) {
    const { keyId, keySecret, isEnabled = true, codEnabled } = body;
    const keepExisting = keySecret === '__KEEP_EXISTING__';

    if (!keyId || !keyId.trim()) {
      throw new BadRequestException('Razorpay Key ID is required.');
    }

    let storeId: string | undefined = tenant?.storeId;
    let tenantId: string | undefined = tenant?.tenantId;
    if (!storeId && tenantId) {
      const store = await this.prisma.store.findFirst({
        where: { tenantId, deletedAt: null },
      });
      if (store?.id) storeId = store.id;
    }

    if (!storeId) {
      throw new BadRequestException('Store context not found.');
    }

    const existing = await this.prisma.merchantPaymentAccount.findFirst({
      where: { storeId, provider: 'RAZORPAY' },
    });

    if (!existing && (!keySecret || keepExisting)) {
      throw new BadRequestException('Razorpay Key Secret is required for first-time setup.');
    }

    const currentCapabilities = (existing?.capabilities as any) || {};
    const updatedCapabilities = codEnabled !== undefined
      ? { ...currentCapabilities, codEnabled }
      : currentCapabilities;

    let account;
    if (existing) {
      account = await this.prisma.merchantPaymentAccount.update({
        where: { id: existing.id },
        data: {
          keyId: keyId.trim(),
          ...(keepExisting ? {} : { keySecretEncrypted: keySecret.trim() }),
          isEnabled,
          capabilities: updatedCapabilities,
        },
      });
    } else {
      account = await this.prisma.merchantPaymentAccount.create({
        data: {
          tenantId: tenantId || tenant.tenantId,
          storeId,
          provider: 'RAZORPAY',
          keyId: keyId.trim(),
          keySecretEncrypted: keySecret.trim(),
          isEnabled,
          capabilities: updatedCapabilities,
        },
      });
    }

    return {
      success: true,
      message: 'Payment credentials saved successfully.',
      keyId: account.keyId,
      isEnabled: account.isEnabled,
      codEnabled: updatedCapabilities.codEnabled !== false,
      secretConfigured: Boolean(account.keySecretEncrypted),
    };
  }

  @Post('payment-settings/cod')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle Cash on Delivery (COD) for this store' })
  async toggleCod(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { codEnabled: boolean }
  ) {
    const { codEnabled } = body;
    const existing = await this.prisma.merchantPaymentAccount.findFirst({
      where: { storeId: tenant.storeId },
    });

    if (existing) {
      const currentCaps = (existing.capabilities as any) || {};
      await this.prisma.merchantPaymentAccount.update({
        where: { id: existing.id },
        data: {
          capabilities: { ...currentCaps, codEnabled },
        },
      });
    } else {
      await this.prisma.merchantPaymentAccount.create({
        data: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          provider: 'RAZORPAY',
          keyId: 'pending_setup',
          keySecretEncrypted: 'pending_setup',
          isEnabled: false,
          capabilities: { codEnabled },
        },
      });
    }

    return {
      success: true,
      codEnabled,
      message: `Cash on Delivery is now ${codEnabled ? 'enabled' : 'disabled'}.`,
    };
  }

  // ============================================================================
  // ============================================================================
  // LOGISTICS & SHIPPING SETTINGS (SELF-DELIVERY & SHIPROCKET)
  // ============================================================================

  @Get('shipping-settings')
  @ApiOperation({ summary: 'Get merchant shipping configuration status' })
  async getShippingSettings(@CurrentTenant() tenant: TenantContext) {
    const selfAccount = await this.prisma.merchantShippingAccount.findFirst({
      where: { storeId: tenant.storeId, provider: ShippingProviderType.MOCK, accountId: 'SELF_DELIVERY' },
    });

    const shiprocketAccount = await this.prisma.merchantShippingAccount.findFirst({
      where: { storeId: tenant.storeId, provider: ShippingProviderType.SHIPROCKET },
    });

    const isSelfDelivery = Boolean(selfAccount && selfAccount.isEnabled);

    if (isSelfDelivery) {
      return {
        connected: true,
        isSelfDelivery: true,
        deliveryMode: 'self',
        provider: 'SELF',
        email: shiprocketAccount?.apiKeyEncrypted || '',
        pickupLocation: shiprocketAccount?.accountId || 'Primary',
        isEnabled: true,
        passwordConfigured: Boolean(shiprocketAccount?.apiSecretEncrypted),
      };
    }

    if (!shiprocketAccount) {
      return {
        connected: false,
        isSelfDelivery: false,
        deliveryMode: 'none',
        provider: 'SHIPROCKET',
        email: '',
        pickupLocation: 'Primary',
        isEnabled: false,
        passwordConfigured: false,
      };
    }

    const isShiprocketConnected = Boolean(shiprocketAccount.apiKeyEncrypted && shiprocketAccount.apiSecretEncrypted);

    return {
      connected: isShiprocketConnected,
      isSelfDelivery: false,
      deliveryMode: isShiprocketConnected ? 'shiprocket' : 'none',
      provider: 'SHIPROCKET',
      email: shiprocketAccount.apiKeyEncrypted,
      pickupLocation: shiprocketAccount.accountId || 'Primary',
      isEnabled: shiprocketAccount.isEnabled,
      passwordConfigured: Boolean(shiprocketAccount.apiSecretEncrypted),
    };
  }

  @Post('shipping-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save or update merchant shipping configuration (Self-Delivery or Shiprocket)' })
  async saveShippingSettings(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: {
      email?: string;
      password?: string;
      pickupLocation?: string;
      isEnabled?: boolean;
      deliveryMode?: 'self' | 'shiprocket';
      isSelfDelivery?: boolean;
    }
  ) {
    const isSelfDelivery = Boolean(body.isSelfDelivery || body.deliveryMode === 'self');

    if (isSelfDelivery) {
      // 1. Upsert Self-Delivery (MOCK) shipping account
      await this.prisma.merchantShippingAccount.upsert({
        where: {
          storeId_provider: { storeId: tenant.storeId, provider: ShippingProviderType.MOCK },
        },
        create: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          provider: ShippingProviderType.MOCK,
          apiKeyEncrypted: 'self_delivery_by_owner',
          apiSecretEncrypted: 'self_delivery_by_owner',
          accountId: 'SELF_DELIVERY',
          isEnabled: true,
        },
        update: {
          apiKeyEncrypted: 'self_delivery_by_owner',
          apiSecretEncrypted: 'self_delivery_by_owner',
          accountId: 'SELF_DELIVERY',
          isEnabled: true,
        },
      });

      // 2. Disable Shiprocket account if present
      const shiprocketExisting = await this.prisma.merchantShippingAccount.findFirst({
        where: { storeId: tenant.storeId, provider: ShippingProviderType.SHIPROCKET },
      });
      if (shiprocketExisting) {
        await this.prisma.merchantShippingAccount.update({
          where: { id: shiprocketExisting.id },
          data: { isEnabled: false },
        });
      }

      // 3. Ensure a default shipping profile exists so shipping setup is completely verified
      const existingProfile = await this.prisma.shippingProfile.findFirst({
        where: { storeId: tenant.storeId, isDefault: true },
      });
      if (!existingProfile) {
        await this.prisma.shippingProfile.create({
          data: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            name: 'Self-Delivery Standard',
            flatRatePaise: 0,
            freeShippingThresholdPaise: null,
            isDefault: true,
          },
        });
      }

      return {
        success: true,
        message: 'Self-delivery mode enabled successfully! You can manage and deliver orders directly without 3rd-party logistics.',
        connected: true,
        isSelfDelivery: true,
        deliveryMode: 'self',
        isEnabled: true,
      };
    }

    // Otherwise, Shiprocket configuration
    const { email, password, pickupLocation = 'Primary', isEnabled = true } = body;
    const keepExisting = !password || password === '__KEEP_EXISTING__';

    if (!email || !email.trim()) {
      throw new BadRequestException('Shiprocket API User Email is required.');
    }

    const existing = await this.prisma.merchantShippingAccount.findFirst({
      where: { storeId: tenant.storeId, provider: ShippingProviderType.SHIPROCKET },
    });

    if (!existing && keepExisting) {
      throw new BadRequestException('Shiprocket API User Password is required for first-time configuration.');
    }

    const cleanEmail = email.trim();
    const cleanPickup = (pickupLocation || 'Primary').trim();
    const cleanPassword = keepExisting ? existing!.apiSecretEncrypted : password!.trim();

    await this.prisma.merchantShippingAccount.upsert({
      where: {
        storeId_provider: { storeId: tenant.storeId, provider: ShippingProviderType.SHIPROCKET },
      },
      create: {
        tenantId: tenant.tenantId,
        storeId: tenant.storeId,
        provider: ShippingProviderType.SHIPROCKET,
        apiKeyEncrypted: cleanEmail,
        apiSecretEncrypted: cleanPassword,
        accountId: cleanPickup,
        isEnabled,
      },
      update: {
        apiKeyEncrypted: cleanEmail,
        ...(keepExisting ? {} : { apiSecretEncrypted: cleanPassword }),
        accountId: cleanPickup,
        isEnabled,
      },
    });

    // Disable MOCK self-delivery account if present
    const selfExisting = await this.prisma.merchantShippingAccount.findFirst({
      where: { storeId: tenant.storeId, provider: ShippingProviderType.MOCK, accountId: 'SELF_DELIVERY' },
    });
    if (selfExisting) {
      await this.prisma.merchantShippingAccount.update({
        where: { id: selfExisting.id },
        data: { isEnabled: false },
      });
    }

    // Ensure shipping profile exists
    const existingProfile = await this.prisma.shippingProfile.findFirst({
      where: { storeId: tenant.storeId, isDefault: true },
    });
    if (!existingProfile) {
      await this.prisma.shippingProfile.create({
        data: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          name: 'Standard Delivery',
          flatRatePaise: 0,
          freeShippingThresholdPaise: null,
          isDefault: true,
        },
      });
    }

    return {
      success: true,
      message: 'Shiprocket logistics settings saved successfully.',
      connected: true,
      isSelfDelivery: false,
      deliveryMode: 'shiprocket',
      email: cleanEmail,
      pickupLocation: cleanPickup,
      isEnabled,
    };
  }

  @Post('shipping-settings/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test merchant Shiprocket API User authentication' })
  async testShippingSettings(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { email: string; password?: string }
  ) {
    let { email, password } = body;
    if (!email || !email.trim()) {
      throw new BadRequestException('Shiprocket API User Email is required to test.');
    }

    if (!password || password === '__KEEP_EXISTING__') {
      const existing = await this.prisma.merchantShippingAccount.findFirst({
        where: { storeId: tenant.storeId, provider: ShippingProviderType.SHIPROCKET },
      });
      if (!existing || !existing.apiSecretEncrypted) {
        throw new BadRequestException('Please enter your Shiprocket API password to test.');
      }
      password = existing.apiSecretEncrypted;
    }

    return this.shiprocketProvider.testCredentials(email.trim(), password.trim());
  }

  @Post('shipping-settings/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle shipping fulfillment enabled / disabled' })
  async toggleShippingEnabled(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { isEnabled: boolean }
  ) {
    const { isEnabled } = body;

    const selfAccount = await this.prisma.merchantShippingAccount.findFirst({
      where: { storeId: tenant.storeId, provider: ShippingProviderType.MOCK, accountId: 'SELF_DELIVERY' },
    });

    if (selfAccount) {
      await this.prisma.merchantShippingAccount.update({
        where: { id: selfAccount.id },
        data: { isEnabled },
      });
      return {
        success: true,
        isEnabled,
        message: `Self-delivery fulfillment is now ${isEnabled ? 'enabled' : 'disabled'}.`,
      };
    }

    const existing = await this.prisma.merchantShippingAccount.findFirst({
      where: { storeId: tenant.storeId, provider: ShippingProviderType.SHIPROCKET },
    });

    if (!existing) {
      throw new NotFoundException('Shipping account not configured yet.');
    }

    await this.prisma.merchantShippingAccount.update({
      where: { id: existing.id },
      data: { isEnabled },
    });

    return {
      success: true,
      isEnabled,
      message: `Shiprocket logistics fulfillment is now ${isEnabled ? 'enabled' : 'disabled'}.`,
    };
  }

  // ============================================================================
  // DELIVERY CHARGES & FREE DELIVERY THRESHOLD RULES
  // ============================================================================

  @Get('delivery-rates')
  @ApiOperation({ summary: 'Get merchant delivery charges and free delivery threshold' })
  async getDeliveryRates(@CurrentTenant() tenant: TenantContext) {
    const profile = await this.prisma.shippingProfile.findFirst({
      where: { storeId: tenant.storeId, isDefault: true },
    });

    const flatRatePaise = profile?.flatRatePaise ?? 0;
    const freeThresholdPaise = profile?.freeShippingThresholdPaise ?? null;

    return {
      deliveryChargeRupees: flatRatePaise / 100,
      freeDeliveryThresholdRupees: freeThresholdPaise ? freeThresholdPaise / 100 : null,
      freeDeliveryEnabled: freeThresholdPaise !== null && freeThresholdPaise !== undefined,
    };
  }

  @Post('delivery-rates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save merchant delivery charges and free delivery threshold' })
  async saveDeliveryRates(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: {
      deliveryChargeRupees: number;
      freeDeliveryThresholdRupees?: number | null;
      freeDeliveryEnabled?: boolean;
    }
  ) {
    const deliveryChargeRupees = Math.max(0, Number(body.deliveryChargeRupees) || 0);
    const flatRatePaise = Math.round(deliveryChargeRupees * 100);

    const freeDeliveryEnabled = Boolean(body.freeDeliveryEnabled);
    const thresholdRupees = Number(body.freeDeliveryThresholdRupees);
    const freeShippingThresholdPaise =
      freeDeliveryEnabled && !isNaN(thresholdRupees) && thresholdRupees > 0
        ? Math.round(thresholdRupees * 100)
        : null;

    const existing = await this.prisma.shippingProfile.findFirst({
      where: { storeId: tenant.storeId, isDefault: true },
    });

    let profile;
    if (existing) {
      profile = await this.prisma.shippingProfile.update({
        where: { id: existing.id },
        data: {
          flatRatePaise,
          freeShippingThresholdPaise,
        },
      });
    } else {
      profile = await this.prisma.shippingProfile.create({
        data: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          name: 'Standard Delivery',
          flatRatePaise,
          freeShippingThresholdPaise,
          isDefault: true,
        },
      });
    }

    return {
      success: true,
      message: 'Delivery charges and free delivery threshold saved successfully.',
      deliveryChargeRupees: profile.flatRatePaise / 100,
      freeDeliveryThresholdRupees: profile.freeShippingThresholdPaise ? profile.freeShippingThresholdPaise / 100 : null,
      freeDeliveryEnabled: profile.freeShippingThresholdPaise !== null,
    };
  }
}

