import { Module, forwardRef } from '@nestjs/common';
import { FriendsModule } from '../friends/friends.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityAdminController } from './activity-admin.controller';
import { ActivityController } from './activity.controller';
import { ActivityModerationController } from './activity-moderation.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [
    forwardRef(() => FriendsModule),
    NotificationsModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [
    ActivityController,
    ActivityModerationController,
    ActivityAdminController,
  ],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
