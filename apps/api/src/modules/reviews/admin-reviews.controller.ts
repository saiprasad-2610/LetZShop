import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { AuthenticatedUser, UserRole } from '@simply/types';
import { ReviewsService } from './reviews.service';

@ApiTags('Admin Review Moderation')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Real PostgreSQL review moderation summary counts' })
  getSummary() {
    return this.reviewsService.getAdminReviewSummary();
  }

  @Get('filters')
  @ApiOperation({ summary: 'Available store and product filter options' })
  getFilters() {
    return this.reviewsService.getAdminReviewFilters();
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get lifecycle timeline for a specific review' })
  getTimeline(@Param('id') id: string) {
    return this.reviewsService.getAdminReviewTimeline(id);
  }

  @Get()
  @ApiOperation({ summary: 'List and search all reviews across merchants for moderation' })
  async getReviews(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('merchantId') merchantId?: string,
    @Query('storeId') storeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('reportStatus') reportStatus?: string,
    @Query('productId') productId?: string,
    @Query('rating') rating?: string,
    @Query('verified') verified?: string,
    @Query('hasComplaint') hasComplaint?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sort') sort?: string,
  ) {
    return this.reviewsService.getAdminReviews({
      status,
      search,
      merchantId,
      storeId,
      reportStatus,
      productId,
      rating,
      verified,
      hasComplaint,
      from,
      to,
      sort,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch('reports/:reportId')
  @ApiOperation({ summary: 'Update report status to UNDER_REVIEW or DISMISSED' })
  updateReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') id: string,
    @Body() body: { status: 'UNDER_REVIEW' | 'DISMISSED'; note?: string },
  ) {
    return this.reviewsService.updateReviewReport(id, user.userId, body.status, body.note);
  }

  @Patch(':id/moderate')
  @ApiOperation({ summary: 'Moderate (remove or restore) a product review with audit reason' })
  async moderateReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    body: {
      action?: 'REMOVE' | 'RESTORE';
      status?: 'ACTIVE' | 'REMOVED';
      reason?: string;
      internalNote?: string;
      buyerMessage?: string;
      merchantMessage?: string;
      notifyBuyerEmail?: boolean;
      notifyBuyerWhatsapp?: boolean;
      notifyMerchantEmail?: boolean;
      notifyMerchantWhatsapp?: boolean;
    },
  ) {
    const rawAction = body?.action || body?.status;
    const effectiveAction: 'REMOVE' | 'RESTORE' | null =
      rawAction === 'REMOVED' || rawAction === 'REMOVE'
        ? 'REMOVE'
        : rawAction === 'ACTIVE' || rawAction === 'RESTORE'
        ? 'RESTORE'
        : null;

    if (!effectiveAction) {
      throw new BadRequestException('Action must be either "REMOVE" or "RESTORE" (or status ACTIVE / REMOVED).');
    }

    const effectiveReason =
      body.reason ||
      body.internalNote ||
      (effectiveAction === 'RESTORE' ? 'Restored by platform admin' : '');

    return this.reviewsService.moderateReview(
      id,
      { userId: user.userId, fullName: user.phone || 'Admin' },
      effectiveAction,
      effectiveReason,
      {
        internalNote: body.internalNote,
        buyerMessage: body.buyerMessage,
        merchantMessage: body.merchantMessage,
        notifyBuyerEmail: body.notifyBuyerEmail,
        notifyBuyerWhatsapp: body.notifyBuyerWhatsapp,
        notifyMerchantEmail: body.notifyMerchantEmail,
        notifyMerchantWhatsapp: body.notifyMerchantWhatsapp,
      },
    );
  }

  @Post(':id/whatsapp-opened')
  @ApiOperation({ summary: 'Record audit log when WhatsApp message is opened' })
  async recordWhatsAppOpened(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { recipientType?: 'MERCHANT' | 'BUYER'; phone?: string },
  ) {
    return this.reviewsService.recordWhatsAppOpened(
      id,
      user.userId,
      body?.recipientType || 'MERCHANT',
      body?.phone,
    );
  }
}
