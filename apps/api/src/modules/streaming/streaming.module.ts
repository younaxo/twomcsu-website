import { Module } from '@nestjs/common';
import { AdminStreamingController, StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';

@Module({
  controllers: [StreamingController, AdminStreamingController],
  providers: [StreamingService],
})
export class StreamingModule {}
