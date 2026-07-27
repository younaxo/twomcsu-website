import { Module } from '@nestjs/common';
import { AdminServersController } from './admin-servers.controller';
import { MonitoringService } from './monitoring.service';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  controllers: [ServersController, AdminServersController],
  providers: [MonitoringService, ServersService],
  exports: [ServersService, MonitoringService],
})
export class MinecraftModule {}
