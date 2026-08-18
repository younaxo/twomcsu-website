import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from '../comments/comments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';
import { DirectMessagesController } from './direct-messages.controller';
import { DirectMessagesGateway } from './direct-messages.gateway';
import { DirectMessagesService } from './direct-messages.service';

@Module({
  imports: [AuthModule, CommentsModule, NotificationsModule, UploadsModule],
  controllers: [DirectMessagesController],
  providers: [DirectMessagesService, DirectMessagesGateway],
  exports: [DirectMessagesService, DirectMessagesGateway],
})
export class DirectMessagesModule {}
