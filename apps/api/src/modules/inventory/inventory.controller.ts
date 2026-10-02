import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, CurrentUser } from '../../common/decorators';
import { AuthenticatedUser, TenantContext } from '@simply/types';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory items for current merchant store' })
  async getInventory(@CurrentTenant() tenant: TenantContext) {
    return this.inventoryService.getStoreInventory(tenant);
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Manually adjust stock for a variant' })
  async adjustStock(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { variantId: string; quantity: number; reason: string }
  ) {
    return this.inventoryService.adjustStock(
      body.variantId,
      body.quantity,
      body.reason || 'Manual inventory adjustment',
      user.userId
    );
  }
}
