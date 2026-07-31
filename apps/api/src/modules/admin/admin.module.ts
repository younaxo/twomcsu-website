import { Module } from '@nestjs/common';
import { ExportModule } from '../export/export.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { AdminController } from './admin.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminPanelController } from './admin-panel.controller';
import { AdminToolsService } from './admin-tools.service';
import { AdminUsersService } from './admin-users.service';
import { AuditService } from './audit.service';

@Module({
  imports: [NotificationsModule, StatisticsModule, ExportModule],
  controllers: [AdminController, AdminPanelController],
  providers: [
    AdminDashboardService,
    AuditService,
    AdminUsersService,
    AdminToolsService,
  ],
  exports: [AuditService, AdminDashboardService, AdminUsersService, AdminToolsService],
})
export class AdminModule {}
