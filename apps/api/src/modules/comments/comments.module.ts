import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { FriendsModule } from '../friends/friends.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminCommentsController, CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { MarkdownService } from './markdown.service';
import { MentionsService } from './mentions.service';

@Module({
  imports: [
    forwardRef(() => FriendsModule),
    NotificationsModule,
    forwardRef(() => ActivityModule),
  ],
  controllers: [CommentsController, AdminCommentsController],
  providers: [CommentsService, MarkdownService, MentionsService],
  exports: [CommentsService, MarkdownService, MentionsService],
})
export class CommentsModule {}
