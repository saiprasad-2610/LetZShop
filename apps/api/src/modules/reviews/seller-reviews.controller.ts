import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant, CurrentUser } from '../../common/decorators';
import { TenantContext, AuthenticatedUser } from '@simply/types';
import { ReviewsService } from './reviews.service';

@ApiTags('Seller Product Reviews')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('seller/reviews')
export class SellerReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'View verified product reviews for the merchant store with filters, stats & pagination' })
  async getStoreReviews(
    @CurrentTenant() tenant: TenantContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('limit') limit?: string,
    @Query('rating') rating?: string,
    @Query('productId') productId?: string,
    @Query('verified') verified?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
    @Query('dateRange') dateRange?: string
  ) {
    return this.reviewsService.getSellerReviews(tenant, {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : limit ? parseInt(limit, 10) : 20,
      rating: rating ? (['BELOW_3', 'LESS_THAN_3', 'NEGATIVE'].includes(rating.toUpperCase()) ? rating.toUpperCase() : parseInt(rating, 10)) : undefined,
      productId: productId || undefined,
      verified: verified !== undefined ? verified : undefined,
      status: status || undefined,
      sort: sort || 'newest',
      search: search || undefined,
      dateRange: dateRange || 'all',
    });
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Merchant request to report a review for platform moderation' })
  async reportReview(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') reviewId: string,
    @Body() body: { reason: string; details?: string }
  ) {
    if (!body?.reason?.trim()) {
      throw new BadRequestException('A valid reason is required to report a review.');
    }
    return this.reviewsService.reportReviewByMerchant(
      tenant,
      reviewId,
      body.reason.trim(),
      body.details?.trim(),
      user
    );
  }
}
