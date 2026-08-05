import { Module, forwardRef } from '@nestjs/common';
import { AchievementsModule } from '../achievements/achievements.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  imports: [
    NotificationsModule,
    forwardRef(() => ActivityModule),
    forwardRef(() => AchievementsModule),
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
