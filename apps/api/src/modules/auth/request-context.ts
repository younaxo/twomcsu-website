import { Request } from 'express';

export interface RequestContext {
  ip: string;
  userAgent?: string;
}

export function getRequestContext(req: Request): RequestContext {
  return {
    ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
    userAgent: req.get('user-agent'),
  };
}
