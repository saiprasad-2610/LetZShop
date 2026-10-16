import { AdminDashboardService } from './admin-dashboard.service';
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminDataService } from './admin-data.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminDataService, AdminDashboardService],
  exports: [AdminService],
})
export class AdminModule {}
