import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Attaches req.user when a valid bearer token is present, otherwise continues anonymously */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();

    if (!request.headers.authorization) {
      return true;
    }

    return Promise.resolve(super.canActivate(context) as boolean | Promise<boolean>).catch(
      () => true,
    );
  }

  override handleRequest<TUser>(err: Error | null, user: TUser): TUser | null {
    if (err || !user) {
      return null;
    }

    return user;
  }
}
