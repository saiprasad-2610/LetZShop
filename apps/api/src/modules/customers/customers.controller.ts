import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators';
import { TenantContext } from '@simply/types';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers for merchant store with order summaries' })
  async getCustomers(@CurrentTenant() tenant: TenantContext) {
    return this.customersService.getCustomers(tenant);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer profile, orders, addresses, and enquiries' })
  async getCustomerById(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string
  ) {
    return this.customersService.getCustomerById(tenant, id);
  }
}
