import { SetMetadata } from '@nestjs/common';
import { RoleGroup } from '@twomc/shared';

export const ROLES_KEY = 'roles';

/** Minimal role group required by the handler, higher groups pass too */
export const Roles = (...roles: RoleGroup[]) => SetMetadata(ROLES_KEY, roles);
