import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { AdminAchievementsController } from './admin-achievements.controller';
import { ModerationAchievementsController } from './moderation-achievements.controller';
import { UserAchievementsController } from './user-achievements.controller';

@Module({
  imports: [
    NotificationsModule,
    forwardRef(() => ActivityModule),
    forwardRef(() => ChatModule),
  ],
  controllers: [
    AchievementsController,
    UserAchievementsController,
    ModerationAchievementsController,
    AdminAchievementsController,
  ],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
