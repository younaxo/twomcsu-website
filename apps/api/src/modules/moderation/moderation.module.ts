import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QuickModerationController } from './quick-moderation.controller';
import { QuickModerationService } from './quick-moderation.service';

@Module({
  imports: [AdminModule, NotificationsModule],
  controllers: [QuickModerationController],
  providers: [QuickModerationService],
  exports: [QuickModerationService],
})
export class ModerationModule {}
