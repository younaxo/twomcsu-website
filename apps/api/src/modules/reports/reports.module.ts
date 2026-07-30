import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from '../comments/comments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';
import { ReportsAttachmentsService } from './reports-attachments.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, CommentsModule, NotificationsModule, UploadsModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsAttachmentsService],
  exports: [ReportsService],
})
export class ReportsModule {}
