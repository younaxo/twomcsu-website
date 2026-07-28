import {
  Injectable,
  NestMiddleware,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload, RoleGroup, hasRoleGroup } from '@twomc/shared';
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
  constructor(
    private readonly system: SystemService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const path = req.originalUrl.split('?')[0] ?? req.path;

    if (ALLOW_PREFIXES.some((p) => path === p.replace(/\/$/, '') || path.startsWith(p))) {
      return next();
    }

    try {
      const maintenance = await this.system.getMaintenanceRow();
      if (!maintenance.isEnabled) {
        return next();
      }

      if (this.isAdminRequest(req)) {
        return next();
      }

      throw new ServiceUnavailableException({
        statusCode: 503,
        message: maintenance.message,
        title: maintenance.title,
        estimatedEnd: maintenance.estimatedEnd?.toISOString() ?? null,
        maintenance: true,
      });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      // DB / migration issues — don't block the whole API
      return next();
    }
  }

  private isAdminRequest(req: Request): boolean {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return false;
    try {
      const payload = this.jwt.verify<AccessTokenPayload>(header.slice(7), {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      });
      return hasRoleGroup(payload.roleGroup, RoleGroup.ADMIN);
    } catch {
      return false;
    }
  }
}
