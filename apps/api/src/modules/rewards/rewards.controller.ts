import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClaimCardDto, CrashDto, RouletteDto, UpgraderDto } from './dto/rewards.dto';
import { MinigamesService } from './minigames.service';
import { RewardsService } from './rewards.service';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}
  @Get() overview(@CurrentUser('id') userId: string) {
    return this.rewards.overview(userId);
  }
  @Post('daily/claim') claim(@CurrentUser('id') userId: string, @Body() dto: ClaimCardDto) {
    return this.rewards.claimCard(userId, dto.cardIndex);
  }
  @Post('wheel/spin') spin(@CurrentUser('id') userId: string) {
    return this.rewards.spinWheel(userId);
  }
}

@Controller('minigames')
@UseGuards(JwtAuthGuard)
export class MinigamesController {
  constructor(private readonly games: MinigamesService) {}
  @Get('history') history(@CurrentUser('id') userId: string) {
    return this.games.history(userId);
  }
  @Post('roulette') roulette(@CurrentUser('id') userId: string, @Body() dto: RouletteDto) {
    return this.games.roulette(userId, dto.bet, dto.color);
  }
  @Post('crash') crash(@CurrentUser('id') userId: string, @Body() dto: CrashDto) {
    return this.games.crash(userId, dto.bet, dto.autoCashout);
  }
  @Post('upgrader') upgrader(@CurrentUser('id') userId: string, @Body() dto: UpgraderDto) {
    return this.games.upgrader(userId, dto.bet, dto.targetMultiplier);
  }
}
