import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  Controller,
  UseGuards,
  Get,
  Post,
  Param,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { ReviewsService } from './reviews.service';

@ApiTags('Storefront Product Reviews')
@Public()
@Controller('storefront')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':slug/reviews/eligible')
  @ApiOperation({ summary: 'Get order items eligible for verified purchase review' })
  async getEligibleReviews(
    @Param('slug') slug: string,
    @Query('orderNumber') orderNumber: string,
    @Query('token') token: string
  ) {
    if (!orderNumber || !token) {
      throw new BadRequestException('Order number and review token are required.');
    }
    return this.reviewsService.getEligibleOrderReviews(slug, orderNumber, token);
  }

  @Post(':slug/reviews')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a verified purchase product review' })
  async submitReview(
    @Param('slug') slug: string,
    @Body()
    body: {
      orderNumber: string;
      token: string;
      orderItemId: string;
      productId: string;
      reviewerName?: string;
      rating: number;
      title?: string;
      body: string;
    }
  ) {
    return this.reviewsService.submitReview(slug, body);
  }

  @Get(':slug/products/:productId/reviews')
  @ApiOperation({ summary: 'Get public verified reviews, rating breakdown, and average for a product' })
  async getProductReviews(
    @Param('slug') slug: string,
    @Param('productId') productId: string
  ) {
    return this.reviewsService.getProductReviews(slug, productId);
  }
}
