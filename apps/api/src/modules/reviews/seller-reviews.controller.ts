import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators';
import { TenantContext } from '@simply/types';
import { ReviewsService } from './reviews.service';

@ApiTags('Seller Product Reviews')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('seller/reviews')
export class SellerReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'View verified product reviews for the merchant store' })
  async getStoreReviews(@CurrentTenant() tenant: TenantContext) {
    return this.reviewsService.getSellerReviews(tenant.storeId);
  }
}
