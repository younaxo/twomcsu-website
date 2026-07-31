import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { CommentsModule } from '../comments/comments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';
import { NewsAdminController } from './news-admin.controller';
import { NewsCommentsService } from './news-comments.service';
import { NewsController } from './news.controller';
import { NewsModerationController } from './news-moderation.controller';
import { NewsService } from './news.service';

@Module({
  imports: [
    CommentsModule,
    UploadsModule,
    NotificationsModule,
    forwardRef(() => ActivityModule),
  ],
  controllers: [NewsController, NewsAdminController, NewsModerationController],
  providers: [NewsService, NewsCommentsService],
  exports: [NewsService, NewsCommentsService],
})
export class NewsModule {}
