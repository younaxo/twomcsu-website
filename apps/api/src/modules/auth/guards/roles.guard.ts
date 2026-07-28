import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { Request } from 'express';
import { AuthenticatedUser } from '../authenticated-user';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleGroup[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();

    if (!user || !required.some((role) => hasRoleGroup(user.roleGroup, role))) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return true;
  }
}
