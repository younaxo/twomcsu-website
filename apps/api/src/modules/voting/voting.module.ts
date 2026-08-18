import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminVotingController, VotingController } from './voting.controller';
import { VotingService } from './voting.service';

@Module({
  imports: [NotificationsModule],
  controllers: [VotingController, AdminVotingController],
  providers: [VotingService],
})
export class VotingModule {}
