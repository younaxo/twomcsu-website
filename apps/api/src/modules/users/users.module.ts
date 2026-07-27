import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { BannersController, MeController } from './me.controller';
import { AdminUsersController, UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UploadsModule],
  controllers: [MeController, BannersController, UsersController, AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}