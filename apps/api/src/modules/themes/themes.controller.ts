import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ThemesService } from './themes.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, Public } from '../../common/decorators';
import { TenantContext } from '@simply/types';

@ApiTags('Themes & Branding')
@Controller('themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Public()
  @Get('available')
  @ApiOperation({ summary: 'List all foundational themes available on the platform' })
  async getAvailableThemes() {
    return this.themesService.getAvailableThemes();
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('branding')
  @ApiOperation({ summary: 'Get current store branding settings' })
  async getBranding(@CurrentTenant() tenant: TenantContext) {
    return this.themesService.getBranding(tenant);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Put('branding')
  @ApiOperation({ summary: 'Update store branding colors and typography' })
  async updateBranding(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: any
  ) {
    return this.themesService.updateBranding(tenant, body);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('sections')
  @ApiOperation({ summary: 'Get store homepage sections' })
  async getSections(@CurrentTenant() tenant: TenantContext) {
    return this.themesService.getSections(tenant);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('config')
  @ApiOperation({ summary: 'Get full theme and studio configuration for current store' })
  async getStoreThemeConfig(@CurrentTenant() tenant: TenantContext) {
    return this.themesService.getStoreThemeConfig(tenant);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Put('config')
  @ApiOperation({ summary: 'Update theme, visual presets, branding, and sections in Brand Studio' })
  async updateStoreThemeConfig(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: any
  ) {
    return this.themesService.updateStoreThemeConfig(tenant, body);
  }
}
