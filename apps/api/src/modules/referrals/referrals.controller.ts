import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { RoleGroup } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateMediaRankDto } from './dto/referrals.dto';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}
  @Get('leaderboard') leaderboard() {
    return this.referrals.leaderboard();
  }
  @Get('me') @UseGuards(JwtAuthGuard) dashboard(@CurrentUser('id') userId: string) {
    return this.referrals.dashboard(userId);
  }
}

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaPartnersController {
  constructor(private readonly referrals: ReferralsService) {}
  @Get('me') dashboard(@CurrentUser('id') userId: string) {
    return this.referrals.mediaDashboard(userId);
  }
}

@Controller('admin/media-partners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminMediaPartnersController {
  constructor(private readonly referrals: ReferralsService) {}
  @Get() list() {
    return this.referrals.adminMediaPartners();
  }
  @Patch(':id/rank') updateRank(@Param('id') id: string, @Body() dto: UpdateMediaRankDto) {
    return this.referrals.updateMediaRank(id, dto.rank);
  }
}
