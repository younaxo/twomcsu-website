import { RoleGroup } from '@twomc/shared';

/** Shape that guards put into req.user */
export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  roleGroup: RoleGroup;
}
