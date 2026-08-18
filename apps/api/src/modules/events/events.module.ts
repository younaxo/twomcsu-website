import { Module } from '@nestjs/common';
import { CommentsModule } from '../comments/comments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminEventsController, EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [CommentsModule, NotificationsModule],
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
