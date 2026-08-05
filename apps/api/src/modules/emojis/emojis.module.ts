import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { AdminEmojisController } from './admin-emojis.controller';
import { EmojisController } from './emojis.controller';
import { EmojisService } from './emojis.service';

@Module({
  imports: [UploadsModule],
  controllers: [EmojisController, AdminEmojisController],
  providers: [EmojisService],
  exports: [EmojisService],
})
export class EmojisModule {}
