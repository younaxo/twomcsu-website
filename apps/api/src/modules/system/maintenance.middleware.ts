import {
  Injectable,
  NestMiddleware,
  ServiceUnavailableException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { SystemService } from './system.service';

const ALLOW_PREFIXES = [
  '/system/',
  '/auth/',
  '/admin/',
  '/announcements/',
  '/health',
  '/uploads/',
];

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private readonly system: SystemService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const path = req.originalUrl.split('?')[0] ?? req.path;

    if (ALLOW_PREFIXES.some((p) => path === p.replace(/\/$/, '') || path.startsWith(p))) {
      return next();
    }

    const maintenance = await this.system.getMaintenanceRow();
    if (!maintenance.isEnabled) {
      return next();
    }

    throw new ServiceUnavailableException({
      statusCode: 503,
      message: maintenance.message,
      title: maintenance.title,
      estimatedEnd: maintenance.estimatedEnd?.toISOString() ?? null,
      maintenance: true,
    });
  }
}
