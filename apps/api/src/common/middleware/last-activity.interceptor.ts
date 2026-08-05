import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class LastActivityInterceptor implements NestInterceptor {
  private readonly lastTouch = new Map<string, number>();
  private readonly throttleMs = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: { id?: string } }>();
    const userId = req.user?.id;
    if (userId) {
      const now = Date.now();
      const prev = this.lastTouch.get(userId) ?? 0;
      if (now - prev >= this.throttleMs) {
        this.lastTouch.set(userId, now);
        void this.prisma.user
          .update({
            where: { id: userId },
            data: { lastActivityAt: new Date(now) },
          })
          .catch(() => undefined);
      }
    }
    return next.handle();
  }
}
