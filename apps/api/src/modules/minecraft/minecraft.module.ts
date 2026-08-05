import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AdminServersController } from './admin-servers.controller';
import { MonitoringService } from './monitoring.service';
import {
  AdminServerCategoriesController,
  ServerCategoriesController,
} from './server-categories.controller';
import { ServerCategoriesService } from './server-categories.service';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  imports: [AdminModule],
  controllers: [
    ServersController,
    AdminServersController,
    ServerCategoriesController,
    AdminServerCategoriesController,
  ],
  providers: [MonitoringService, ServersService, ServerCategoriesService],
  exports: [ServersService, MonitoringService, ServerCategoriesService],
})
export class MinecraftModule {}
