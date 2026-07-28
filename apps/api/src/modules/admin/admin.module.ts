import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AuditService } from './audit.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminController],
  providers: [AdminDashboardService, AuditService],
  exports: [AuditService, AdminDashboardService],
})
export class AdminModule {}
