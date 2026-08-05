import { Module } from '@nestjs/common';
import { CommentsModule } from '../comments/comments.module';
import { UploadsModule } from '../uploads/uploads.module';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

@Module({
  imports: [CommentsModule, UploadsModule],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
