import { Module } from '@nestjs/common';
import { MinigamesController, RewardsController } from './rewards.controller';
import { MinigamesService } from './minigames.service';
import { RewardsService } from './rewards.service';

@Module({
  controllers: [RewardsController, MinigamesController],
  providers: [RewardsService, MinigamesService],
})
export class RewardsModule {}
