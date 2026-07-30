import {
  PunishmentType,
  Report,
  ReportAttachment as ReportAttachmentRow,
  ReportEvidenceLink as ReportEvidenceLinkRow,
  ReportMessage as ReportMessageRow,
  ReportStatus,
  ReportTarget as ReportTargetRow,
  ReportType,
  User,
  UserPunishment,
  Position,
} from '@prisma/client';
import {
  ReportAttachment,
  ReportDetails,
  ReportEvidenceLink,
  ReportMessage,
  ReportSummary,
  ReportTarget,
  ReportUserSummary,
  UserPunishmentSummary,
} from '@twomc/shared';
import { selectPublicPosition } from '../../common/prisma/user-selects';

type ReportUserRow = Pick<User, 'id' | 'shortId' | 'tag' | 'username' | 'avatar' | 'roleGroup'> & {
  position: Pick<
    Position,
    | 'id'
    | 'name'
    | 'slug'
    | 'displayName'
    | 'group'
    | 'color'
    | 'backgroundColor'
    | 'icon'
    | 'priority'
  >;
};

const OVERDUE_MS = 24 * 60 * 60 * 1000;

export const reportUserSelect = {
  id: true,
  shortId: true,
  tag: true,
  username: true,
  avatar: true,
  roleGroup: true,
  position: { select: selectPublicPosition },
} as const;

export function toReportUser(row: ReportUserRow): ReportUserSummary {
  return {
    id: row.id,
    shortId: row.shortId,
    tag: row.tag,
    username: row.username,
    avatar: row.avatar,
    roleGroup: row.roleGroup,
    position: {
      id: row.position.id,
      name: row.position.name,
      slug: row.position.slug,
      displayName: row.position.displayName,
      group: row.position.group,
      color: row.position.color,
      backgroundColor: row.position.backgroundColor,
      icon: row.position.icon,
      priority: row.position.priority,
    },
  };
}

export function toReportAttachment(row: ReportAttachmentRow): ReportAttachment {
  return {
    id: row.id,
    fileName: row.fileName,
    fileUrl: row.fileUrl,
    fileSize: row.fileSize,
    mimeType: row.mimeType,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toReportMessage(
  row: ReportMessageRow & { author: ReportUserRow },
): ReportMessage {
  return {
    id: row.id,
    content: row.content,
    contentHtml: row.contentHtml,
    isStaff: row.isStaff,
    isInternal: row.isInternal,
    isSystem: row.isSystem,
    createdAt: row.createdAt.toISOString(),
    author: toReportUser(row.author),
  };
}

export function toReportTarget(
  row: ReportTargetRow & { user: ReportUserRow | null },
): ReportTarget {
  return {
    id: row.id,
    username: row.username,
    userId: row.userId,
    user: row.user ? toReportUser(row.user) : null,
    order: row.order,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toReportEvidenceLink(row: ReportEvidenceLinkRow): ReportEvidenceLink {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    type: row.type,
    order: row.order,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toUserPunishmentSummary(
  row: UserPunishment & { issuedByUser: ReportUserRow | null },
): UserPunishmentSummary {
  return {
    id: row.id,
    punishmentType: row.punishmentType as PunishmentType,
    reason: row.reason,
    duration: row.duration,
    server: row.server,
    issuedAt: row.issuedAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    isActive: row.isActive,
    isAppealable: row.isAppealable,
    issuedByUser: row.issuedByUser ? toReportUser(row.issuedByUser) : null,
  };
}

type ReportListRow = Report & {
  author: ReportUserRow;
  assignedTo: ReportUserRow | null;
  targets?: (ReportTargetRow & { user: ReportUserRow | null })[];
};

export function isReportOverdue(row: Pick<Report, 'status' | 'createdAt' | 'updatedAt'>): boolean {
  if (
    row.status === ReportStatus.RESOLVED ||
    row.status === ReportStatus.REJECTED ||
    row.status === ReportStatus.CLOSED
  ) {
    return false;
  }

  return Date.now() - row.updatedAt.getTime() > OVERDUE_MS;
}

export function toReportSummary(row: ReportListRow): ReportSummary {
  const targets = (row.targets ?? []).map(toReportTarget);
  const first = targets[0] ?? null;

  return {
    id: row.id,
    reportNumber: row.reportNumber,
    type: row.type as ReportType,
    status: row.status as ReportStatus,
    author: toReportUser(row.author),
    targetUsername: first?.username ?? null,
    targetUserId: first?.userId ?? null,
    targets,
    server: row.server,
    incidentDate: row.incidentDate?.toISOString() ?? null,
    assignedTo: row.assignedTo ? toReportUser(row.assignedTo) : null,
    isLocked: row.isLocked,
    isOverdue: isReportOverdue(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  };
}

type ReportDetailRow = ReportListRow & {
  messages: (ReportMessageRow & { author: ReportUserRow })[];
  attachments: ReportAttachmentRow[];
  evidenceLinks: ReportEvidenceLinkRow[];
  appealedPunishment:
    | (UserPunishment & { issuedByUser: ReportUserRow | null })
    | null;
};

export function toReportDetails(
  row: ReportDetailRow,
  options?: { includeInternal?: boolean },
): ReportDetails {
  const messages = options?.includeInternal
    ? row.messages
    : row.messages.filter((message) => !message.isInternal);

  return {
    ...toReportSummary(row),
    description: row.description,
    descriptionHtml: row.descriptionHtml,
    evidenceLinks: (row.evidenceLinks ?? []).map(toReportEvidenceLink),
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    paymentDate: row.paymentDate?.toISOString() ?? null,
    additionalText: row.additionalText,
    verdict: row.verdict,
    verdictHtml: row.verdictHtml,
    punishmentType: (row.punishmentType as PunishmentType | null) ?? null,
    punishmentDuration: row.punishmentDuration,
    punishmentReason: row.punishmentReason,
    appealedPunishmentId: row.appealedPunishmentId,
    appealedPunishment: row.appealedPunishment
      ? toUserPunishmentSummary(row.appealedPunishment)
      : null,
    lockedBy: row.lockedBy,
    lockedReason: row.lockedReason,
    messages: messages.map(toReportMessage),
    attachments: row.attachments.map(toReportAttachment),
  };
}
