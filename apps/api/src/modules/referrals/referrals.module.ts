import { Module } from '@nestjs/common';
import {
  AdminMediaPartnersController,
  MediaPartnersController,
  ReferralsController,
} from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  controllers: [ReferralsController, MediaPartnersController, AdminMediaPartnersController],
  providers: [ReferralsService],
})
export class ReferralsModule {}
