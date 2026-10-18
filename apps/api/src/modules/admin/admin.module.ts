import { AdminDashboardService } from './admin-dashboard.service';
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminDataService } from './admin-data.service';

import { NotificationsModule } from '../notifications/notifications.module';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [NotificationsModule, VerificationModule],
  controllers: [AdminController],
  providers: [AdminService, AdminDataService, AdminDashboardService],
  exports: [AdminService],
})
export class AdminModule {}
