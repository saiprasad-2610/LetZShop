import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EnquiriesService, CreateEnquiryInput } from './enquiries.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, Public } from '../../common/decorators';
import { TenantContext } from '@simply/types';
import { EnquiryStatus } from '@prisma/client';

@ApiTags('B2B Enquiries')
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Public()
  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit buyer B2B enquiry or RFQ (Public)' })
  async createEnquiry(@Body() input: CreateEnquiryInput) {
    return this.enquiriesService.createEnquiry(input);
  }

  @Public()
  @Post('whatsapp')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Record buyer WhatsApp click enquiry (Public)' })
  async recordWhatsappEnquiry(@Body() input: any) {
    return this.enquiriesService.recordWhatsappEnquiry(input);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get()
  @ApiOperation({ summary: 'List enquiries for merchant store' })
  async getEnquiries(@CurrentTenant() tenant: TenantContext) {
    return this.enquiriesService.getEnquiries(tenant);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Put(':id/quotation')
  @ApiOperation({ summary: 'Update quotation and response for enquiry' })
  async respond(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: { quotationAmountPaise?: number; notes?: string; status?: EnquiryStatus }
  ) {
    return this.enquiriesService.respondToEnquiry(
      tenant,
      id,
      body.quotationAmountPaise,
      body.notes,
      body.status
    );
  }
}
