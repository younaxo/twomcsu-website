import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const SLOW_MS = 500;
const WARN_MS = 1000;

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const started = Date.now();

    res.on('finish', () => {
      const elapsedMs = Date.now() - started;

      if (elapsedMs >= WARN_MS) {
        this.logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs}ms`);
      } else if (elapsedMs >= SLOW_MS) {
        this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs}ms`);
      }
    });

    const originalWriteHead = res.writeHead.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).writeHead = (...args: unknown[]) => {
      if (!res.getHeader('X-Response-Time')) {
        res.setHeader('X-Response-Time', `${Date.now() - started}ms`);
      }
      return originalWriteHead(...(args as Parameters<typeof res.writeHead>));
    };

    next();
  }
}
