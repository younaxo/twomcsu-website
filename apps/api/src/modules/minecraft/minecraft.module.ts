import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AdminServersController } from './admin-servers.controller';
import { MonitoringService } from './monitoring.service';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  imports: [AdminModule],
  controllers: [ServersController, AdminServersController],
  providers: [MonitoringService, ServersService],
  exports: [ServersService, MonitoringService],
})
export class MinecraftModule {}
