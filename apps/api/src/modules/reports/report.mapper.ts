import {
  PunishmentType,
  Report,
  ReportAttachment as ReportAttachmentRow,
  ReportEvidenceLink as ReportEvidenceLinkRow,
  ReportMessage as ReportMessageRow,
  ReportModeratorNote as ReportModeratorNoteRow,
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
  ReportModeratorNote,
  ReportParticipationRole,
  ReportSummary,
  ReportTarget,
  ReportUserSummary,
  UserPunishmentSummary,
} from '@twomc/shared';
import { selectPublicPosition } from '../../common/prisma/user-selects';
import { getReportParticipationRole } from './report-access.util';

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
const DELETED_BY_MODERATOR_PLACEHOLDER = '[Сообщение удалено модератором]';
const DELETED_BY_AUTHOR_PLACEHOLDER = '[Сообщение удалено]';

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
  options?: { revealDeletedContent?: boolean },
): ReportMessage {
  const revealDeleted = options?.revealDeletedContent ?? false;
  const isDeleted = row.isDeleted;
  const placeholder =
    row.deletedBy === row.authorId
      ? DELETED_BY_AUTHOR_PLACEHOLDER
      : DELETED_BY_MODERATOR_PLACEHOLDER;

  return {
    id: row.id,
    content: isDeleted && !revealDeleted ? placeholder : row.content,
    contentHtml:
      isDeleted && !revealDeleted
        ? `<p>${placeholder}</p>`
        : row.contentHtml,
    isStaff: row.isStaff,
    isSystem: row.isSystem,
    isDeleted,
    isPinned: row.isPinned,
    pinnedAt: row.pinnedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    author: toReportUser(row.author),
  };
}

export function toReportModeratorNote(
  row: ReportModeratorNoteRow & { author: ReportUserRow },
): ReportModeratorNote {
  return {
    id: row.id,
    content: row.content,
    contentHtml: row.contentHtml,
    isPinned: row.isPinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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

export function toReportSummary(
  row: ReportListRow,
  options?: { viewerId?: string },
): ReportSummary {
  const targets = (row.targets ?? []).map(toReportTarget);
  const first = targets[0] ?? null;
  const viewerRole: ReportParticipationRole | null = options?.viewerId
    ? getReportParticipationRole(row, options.viewerId)
    : null;

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
    viewerRole,
  };
}

type ReportDetailRow = ReportListRow & {
  messages: (ReportMessageRow & { author: ReportUserRow })[];
  attachments: ReportAttachmentRow[];
  evidenceLinks: ReportEvidenceLinkRow[];
  moderatorNotes?: (ReportModeratorNoteRow & { author: ReportUserRow })[];
  appealedPunishment:
    | (UserPunishment & { issuedByUser: ReportUserRow | null })
    | null;
};

export function toReportDetails(
  row: ReportDetailRow,
  options?: { includeModeratorNotes?: boolean; revealDeletedContent?: boolean; viewerId?: string },
): ReportDetails {
  const revealDeleted = options?.revealDeletedContent ?? false;
  const sortedMessages = [...row.messages].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }
    if (left.isPinned && right.isPinned && left.pinnedAt && right.pinnedAt) {
      return left.pinnedAt.getTime() - right.pinnedAt.getTime();
    }
    return left.createdAt.getTime() - right.createdAt.getTime();
  });

  const details: ReportDetails = {
    ...toReportSummary(row, { viewerId: options?.viewerId }),
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
    messages: sortedMessages.map((message) =>
      toReportMessage(message, { revealDeletedContent: revealDeleted }),
    ),
    attachments: row.attachments.map(toReportAttachment),
  };

  if (options?.includeModeratorNotes) {
    details.isArchived = row.isArchived;
    details.archivedAt = row.archivedAt?.toISOString() ?? null;
    details.archivedBy = row.archivedBy;
    details.archiveReason = row.archiveReason;
    details.moderatorNotes = (row.moderatorNotes ?? [])
      .slice()
      .sort((left, right) => {
        if (left.isPinned !== right.isPinned) {
          return left.isPinned ? -1 : 1;
        }
        return left.createdAt.getTime() - right.createdAt.getTime();
      })
      .map(toReportModeratorNote);
  }

  return details;
}
