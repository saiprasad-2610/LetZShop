import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { AuthService } from '../auth/auth.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, CurrentUser, Public } from '../../common/decorators';
import { AuthenticatedUser, TenantContext } from '@simply/types';
import { OnboardMerchantDto } from './dto/onboard-merchant.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Stores & Storefront')
@Controller()
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly authService: AuthService
  ) {}

  // 1. Seller Merchant API
  @Get('stores/slug-availability')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async slugAvailability(@Query('name') name: string) {
    if (typeof name !== 'string' || !name.trim() || name.length > 100) throw new BadRequestException('Business name must contain 1–100 characters.');
    return this.storesService.suggestSlug(name);
  }

  @ApiBearerAuth()
  @Post('stores/onboard')
  @ApiOperation({ summary: 'First-time onboarding to create merchant business and store' })
  async onboard(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OnboardMerchantDto
  ) {
    const result = await this.storesService.onboardMerchant(user, dto);
    const tokens = this.authService.issueTokensForUser(
      { id: user.userId, phone: user.phone, role: 'SELLER_OWNER', isSuperAdmin: user.isPlatformAdmin },
      result.tenant.id,
      result.store.id,
      user.sessionId
    );
    return {
      ...result,
      ...tokens,
      accessToken: tokens.accessToken,
      user: tokens.user,
    };
  }

  @ApiBearerAuth()
  @Get('stores/my-store')
  @ApiOperation({ summary: 'Get current merchant store details' })
  async getMyStore(@CurrentUser() user: AuthenticatedUser) {
    if (!user.tenantId) throw new NotFoundException('Complete onboarding to create your store.');
    return this.storesService.getStoreByTenantId(user.tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('stores/my-store/metrics')
  @ApiOperation({ summary: 'Get live metrics and attention items for dashboard' })
  async getMetrics(@CurrentTenant() tenant: TenantContext) {
    return this.storesService.getStoreMetrics(tenant.tenantId, tenant.storeId);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('stores/my-store/preview')
  @ApiOperation({ summary: 'Private preview of store for authenticated merchant' })
  async getPrivatePreview(@CurrentTenant() tenant: TenantContext, @CurrentUser() user: AuthenticatedUser) {
    const store = await this.storesService.getStoreByTenantId(tenant.tenantId);
    return this.storesService.getPublicStorefront(store.slug, { authenticatedUser: user });
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Post('stores')
  @ApiOperation({ summary: 'Create new store for current merchant' })
  async createStore(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { name: string; slug?: string; description?: string }
  ) {
    return this.storesService.createStore(
      {
        tenantId: tenant.tenantId,
        name: body.name,
        slug: body.slug,
        description: body.description,
      },
      user.userId
    );
  }
}

