import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/catalog.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, CurrentUser } from '../../common/decorators';
import { AuthenticatedUser, TenantContext } from '@simply/types';

@ApiTags('Catalog')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('catalog/products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @ApiOperation({ summary: 'Create new product with options, variants and initial inventory' })
  async createProduct(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto
  ) {
    return this.catalogService.createProduct(tenant, dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List products for authenticated tenant with pagination & search' })
  async getProducts(
    @CurrentTenant() tenant: TenantContext,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.catalogService.getProducts(tenant, { search, categoryId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID strictly scoped to current tenant' })
  async getProductById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string
  ) {
    return this.catalogService.getProductById(tenant, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product basic details, options, and specifications' })
  async updateProduct(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>
  ) {
    return this.catalogService.updateProduct(tenant, id, dto, user.userId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing product and its variants' })
  async duplicateProduct(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.catalogService.duplicateProduct(tenant, id, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete product and archive its variants' })
  async deleteProduct(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.catalogService.deleteProduct(tenant, id, user.userId);
  }
}
