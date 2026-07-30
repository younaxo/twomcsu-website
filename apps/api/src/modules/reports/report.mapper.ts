import {
  PunishmentType,
  Report,
  ReportAttachment as ReportAttachmentRow,
  ReportMessage as ReportMessageRow,
  ReportStatus,
  ReportType,
  User,
  Position,
} from '@prisma/client';
import {
  ReportAttachment,
  ReportDetails,
  ReportMessage,
  ReportSummary,
  ReportUserSummary,
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

type ReportListRow = Report & {
  author: ReportUserRow;
  assignedTo: ReportUserRow | null;
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
  return {
    id: row.id,
    reportNumber: row.reportNumber,
    type: row.type as ReportType,
    status: row.status as ReportStatus,
    author: toReportUser(row.author),
    targetUsername: row.targetUsername,
    targetUserId: row.targetUserId,
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
    evidenceLinks: row.evidenceLinks,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    paymentDate: row.paymentDate?.toISOString() ?? null,
    additionalText: row.additionalText,
    verdict: row.verdict,
    verdictHtml: row.verdictHtml,
    punishmentType: (row.punishmentType as PunishmentType | null) ?? null,
    punishmentDuration: row.punishmentDuration,
    punishmentReason: row.punishmentReason,
    lockedBy: row.lockedBy,
    lockedReason: row.lockedReason,
    messages: messages.map(toReportMessage),
    attachments: row.attachments.map(toReportAttachment),
  };
}
