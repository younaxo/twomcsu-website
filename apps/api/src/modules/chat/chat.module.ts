import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from '../comments/comments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminChatController } from './admin-chat.controller';
import { AntiSpamService } from './anti-spam.service';
import { ChannelsService } from './channels.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { LinkPreviewService } from './link-preview.service';
import { MessagesService } from './messages.service';
import { ModerationService } from './moderation.service';

@Module({
  imports: [AuthModule, CommentsModule, NotificationsModule],
  controllers: [ChatController, AdminChatController],
  providers: [
    ChatGateway,
    ChannelsService,
    MessagesService,
    ModerationService,
    AntiSpamService,
    LinkPreviewService,
  ],
  exports: [ChannelsService, MessagesService, ModerationService, ChatGateway],
})
export class ChatModule {}
