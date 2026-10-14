import {
  Controller,
  Get,
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

  @Get()
  @ApiOperation({ summary: 'List and search all reviews across merchants for moderation' })
  async getReviews(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.reviewsService.getAdminReviews({
      status,
      search,
      storeId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch(':id/moderate')
  @ApiOperation({ summary: 'Moderate (remove or restore) a product review with audit reason' })
  async moderateReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { action: 'REMOVE' | 'RESTORE'; reason?: string }
  ) {
    if (!body || !['REMOVE', 'RESTORE'].includes(body.action)) {
      throw new BadRequestException('Action must be either "REMOVE" or "RESTORE".');
    }
    return this.reviewsService.moderateReview(
      id,
      { userId: user.userId, fullName: user.phone || 'Admin' },
      body.action,
      body.reason
    );
  }
}
