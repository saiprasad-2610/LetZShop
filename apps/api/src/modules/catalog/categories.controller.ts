import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators';
import { TenantContext } from '@simply/types';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('catalog/categories')
export class CategoriesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List categories for current merchant store' })
  async getCategories(@CurrentTenant() tenant: TenantContext) {
    return this.catalogService.getCategories(tenant);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category for merchant store' })
  async createCategory(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { name: string; description?: string; imageUrl?: string }
  ) {
    return this.catalogService.createCategory(tenant, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing category' })
  async updateCategory(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string }
  ) {
    return this.catalogService.updateCategory(tenant, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string
  ) {
    return this.catalogService.deleteCategory(tenant, id);
  }
}
