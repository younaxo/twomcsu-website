import { RoleGroup, ReportType, hasRoleGroup } from '@twomc/shared';

/** Minimum role group allowed to review a report of this type */
export function minRoleForReportType(type: ReportType): RoleGroup {
  switch (type) {
    case ReportType.PLAYER_COMPLAINT:
      return RoleGroup.MODERATOR;
    case ReportType.ADMIN_COMPLAINT:
    case ReportType.PUNISHMENT_APPEAL:
      return RoleGroup.ADMIN;
    case ReportType.DONATION_PROBLEM:
      return RoleGroup.OWNER;
    case ReportType.TECHNICAL_ISSUE:
    case ReportType.OTHER:
    default:
      return RoleGroup.HELPER;
  }
}

export function canReviewReportType(roleGroup: RoleGroup, type: ReportType): boolean {
  return hasRoleGroup(roleGroup, minRoleForReportType(type));
}

export function isStaffRole(roleGroup: RoleGroup): boolean {
  return hasRoleGroup(roleGroup, RoleGroup.HELPER);
}
