import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReviewsService } from './reviews.service';
import { ReviewModerationService } from './review-moderation.service';
import { ReviewsController } from './reviews.controller';
import { AdminReviewsController } from './admin-reviews.controller';
import { SellerReviewsController } from './seller-reviews.controller';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ReviewsController, AdminReviewsController, SellerReviewsController],
  providers: [ReviewsService, ReviewModerationService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
