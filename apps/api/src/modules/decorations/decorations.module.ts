import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminDecorationsController, DecorationsController } from './decorations.controller';
import { DecorationsService } from './decorations.service';

@Module({
  imports: [NotificationsModule],
  controllers: [DecorationsController, AdminDecorationsController],
  providers: [DecorationsService],
  exports: [DecorationsService],
})
export class DecorationsModule {}
