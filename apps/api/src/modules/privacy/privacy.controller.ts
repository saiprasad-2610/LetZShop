import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrivacyService } from './privacy.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, CurrentUser, Public } from '../../common/decorators';
import { AuthenticatedUser, TenantContext } from '@simply/types';
import { ConsentPurpose, DataSubjectRequestType } from '@prisma/client';

@ApiTags('Privacy & DPDPA')
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Public()
  @Post('consent')
  @ApiOperation({ summary: 'Record customer consent for terms/privacy/marketing' })
  async recordConsent(
    @Body() body: {
      tenantId: string;
      storeId: string;
      phone: string;
      purpose: ConsentPurpose;
    }
  ) {
    return this.privacyService.recordConsent(body);
  }

  @Public()
  @Post('data-subject-requests')
  @ApiOperation({ summary: 'Submit DPDPA data access or erasure request' })
  async createRequest(
    @Body() body: {
      tenantId: string;
      phone: string;
      email?: string;
      requestType: DataSubjectRequestType;
      reason?: string;
    }
  ) {
    return this.privacyService.createDataSubjectRequest(body);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('export/:phone')
  @ApiOperation({ summary: 'Export all data associated with a customer phone (DPDPA Access)' })
  async exportData(
    @CurrentTenant() tenant: TenantContext,
    @Param('phone') phone: string
  ) {
    return this.privacyService.exportCustomerData(tenant.tenantId, phone);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Post('anonymize')
  @ApiOperation({ summary: 'Scrub personal customer data (DPDPA Right to be Forgotten)' })
  async anonymize(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body('phone') phone: string
  ) {
    return this.privacyService.anonymizeCustomerData(tenant.tenantId, phone, user.userId);
  }
}
