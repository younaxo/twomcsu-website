import {
  RoleGroup,
  canReviewReportType,
  hasRoleGroup,
  minRoleForReportType,
} from '@twomc/shared';

export { canReviewReportType, minRoleForReportType };

export function isStaffRole(roleGroup: RoleGroup): boolean {
  return hasRoleGroup(roleGroup, RoleGroup.HELPER);
}
