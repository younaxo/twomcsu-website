import {
  RoleGroup,
  ReportParticipationRole,
  canReviewReportType,
  hasRoleGroup,
  minRoleForReportType,
} from '@twomc/shared';

export { canReviewReportType, minRoleForReportType };

export function isStaffRole(roleGroup: RoleGroup): boolean {
  return hasRoleGroup(roleGroup, RoleGroup.HELPER);
}

type ParticipationRow = {
  authorId: string;
  assignedToId: string | null;
  targets?: { userId: string | null }[];
};

export function getReportParticipationRole(
  row: ParticipationRow,
  viewerId: string,
): ReportParticipationRole | null {
  if (row.authorId === viewerId) {
    return 'author';
  }
  if (row.assignedToId === viewerId) {
    return 'moderator';
  }
  if (row.targets?.some((target) => target.userId === viewerId)) {
    return 'target';
  }
  return null;
}

export function isReportTarget(row: ParticipationRow, viewerId: string): boolean {
  return row.targets?.some((target) => target.userId === viewerId) ?? false;
}
