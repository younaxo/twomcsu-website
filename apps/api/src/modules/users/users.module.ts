import { Module, forwardRef } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { FriendsModule } from '../friends/friends.module';
import { UploadsModule } from '../uploads/uploads.module';
import { BannersController, MeController } from './me.controller';
import { AdminUsersController, UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    UploadsModule,
    forwardRef(() => FriendsModule),
    forwardRef(() => ActivityModule),
  ],
  controllers: [MeController, BannersController, UsersController, AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
