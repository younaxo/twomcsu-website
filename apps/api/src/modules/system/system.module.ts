import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MaintenanceMiddleware } from './maintenance.middleware';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  imports: [PrismaModule],
  controllers: [SystemController],
  providers: [SystemService, MaintenanceMiddleware],
  exports: [SystemService],
})
export class SystemModule {}
