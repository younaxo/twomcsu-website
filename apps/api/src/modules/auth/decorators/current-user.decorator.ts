import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../authenticated-user';

export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();

    if (!request.user) {
      return undefined;
    }

    return field ? request.user[field] : request.user;
  },
);
