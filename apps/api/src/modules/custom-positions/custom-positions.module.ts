import { Module } from '@nestjs/common';
import { CustomPositionsController } from './custom-positions.controller';
import { CustomPositionsService } from './custom-positions.service';

@Module({
  controllers: [CustomPositionsController],
  providers: [CustomPositionsService],
  exports: [CustomPositionsService],
})
export class CustomPositionsModule {}
