import type { Position } from './position';
import { RoleGroup, hasRoleGroup } from './user';

export const ReportType = {
  PLAYER_COMPLAINT: 'PLAYER_COMPLAINT',
  ADMIN_COMPLAINT: 'ADMIN_COMPLAINT',
  PUNISHMENT_APPEAL: 'PUNISHMENT_APPEAL',
  TECHNICAL_ISSUE: 'TECHNICAL_ISSUE',
  DONATION_PROBLEM: 'DONATION_PROBLEM',
  OTHER: 'OTHER',
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const ReportStatus = {
  PENDING: 'PENDING',
  IN_REVIEW: 'IN_REVIEW',
  WAITING_RESPONSE: 'WAITING_RESPONSE',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED',
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const PunishmentType = {
  WARN: 'WARN',
  MUTE: 'MUTE',
  KICK: 'KICK',
  TEMPBAN: 'TEMPBAN',
  PERMBAN: 'PERMBAN',
} as const;

export type PunishmentType = (typeof PunishmentType)[keyof typeof PunishmentType];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  PLAYER_COMPLAINT: 'Жалоба на игроков',
  ADMIN_COMPLAINT: 'Жалоба на администрацию',
  PUNISHMENT_APPEAL: 'Обжалование наказания',
  TECHNICAL_ISSUE: 'Технический вопрос',
  DONATION_PROBLEM: 'Проблема с донатом',
  OTHER: 'Другое',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Ожидает',
  IN_REVIEW: 'На рассмотрении',
  WAITING_RESPONSE: 'Ожидает ответа',
  RESOLVED: 'Рассмотрено',
  REJECTED: 'Отклонено',
  CLOSED: 'Закрыто',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: '#F59E0B',
  IN_REVIEW: '#3B82F6',
  WAITING_RESPONSE: '#8B5CF6',
  RESOLVED: '#10B981',
  REJECTED: '#EF4444',
  CLOSED: '#6B7280',
};

export const PUNISHMENT_TYPE_LABELS: Record<PunishmentType, string> = {
  WARN: 'Предупреждение',
  MUTE: 'Мут',
  KICK: 'Кик',
  TEMPBAN: 'Временный бан',
  PERMBAN: 'Перманентный бан',
};

/** Topic slug with RULES for the create-report step */
export const REPORT_RULES_SLUGS: Record<Exclude<ReportType, 'DONATION_PROBLEM'>, string> = {
  PLAYER_COMPLAINT: 'player-complaint-rules',
  ADMIN_COMPLAINT: 'admin-complaint-rules',
  PUNISHMENT_APPEAL: 'punishment-appeal-rules',
  TECHNICAL_ISSUE: 'technical-issue-rules',
  OTHER: 'other-report-rules',
};

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

export function detectEvidenceLinkType(
  url: string,
): 'youtube' | 'twitch' | 'imgur' | 'google_drive' | 'other' {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('twitch.tv')) return 'twitch';
  if (lower.includes('imgur.com')) return 'imgur';
  if (lower.includes('drive.google.com')) return 'google_drive';
  return 'other';
}

export type ReportParticipationRole = 'author' | 'target' | 'moderator';

export interface ReportUserSummary {
  id: string;
  shortId: number;
  tag: string;
  username: string;
  avatar: string | null;
  roleGroup: RoleGroup;
  position: Position;
}

export interface ReportTarget {
  id: string;
  username: string;
  userId: string | null;
  user: ReportUserSummary | null;
  order: number;
  createdAt: string;
}

export interface ReportEvidenceLink {
  id: string;
  url: string;
  title: string | null;
  type: string | null;
  order: number;
  createdAt: string;
}

export interface ReportAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ReportMessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ReportMessage {
  id: string;
  content: string;
  contentHtml: string | null;
  isStaff: boolean;
  isSystem: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  pinnedAt: string | null;
  createdAt: string;
  author: ReportUserSummary;
  attachments: ReportMessageAttachment[];
}

export interface ReportModeratorNote {
  id: string;
  content: string;
  contentHtml: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: ReportUserSummary;
}

export interface UserPunishmentSummary {
  id: string;
  punishmentType: PunishmentType;
  reason: string;
  duration: string | null;
  server: string | null;
  issuedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  isAppealable: boolean;
  issuedByUser: ReportUserSummary | null;
}

/** Placeholder until TigerReports bridge is wired */
export interface GameReportSummary {
  id: string;
}

/** Placeholder until LiteBans bridge is wired */
export interface GamePunishmentSummary {
  id: string;
}

export interface ReportSummary {
  id: string;
  reportNumber: string;
  type: ReportType;
  status: ReportStatus;
  author: ReportUserSummary;
  /** @deprecated use targets — kept for list preview of first nickname */
  targetUsername: string | null;
  targetUserId: string | null;
  targets: ReportTarget[];
  server: string | null;
  incidentDate: string | null;
  assignedTo: ReportUserSummary | null;
  isLocked: boolean;
  isOverdue: boolean;
  hasVerdict: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  /** Current viewer's role in this report, when known */
  viewerRole?: ReportParticipationRole | null;
}

export interface ReportDetails extends ReportSummary {
  description: string;
  descriptionHtml: string | null;
  evidenceLinks: ReportEvidenceLink[];
  contactEmail: string | null;
  contactPhone: string | null;
  paymentDate: string | null;
  additionalText: string | null;
  verdict: string | null;
  verdictHtml: string | null;
  punishmentType: PunishmentType | null;
  punishmentDuration: string | null;
  punishmentReason: string | null;
  appealedPunishmentId: string | null;
  appealedPunishment: UserPunishmentSummary | null;
  lockedBy: string | null;
  lockedReason: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  archivedBy?: string | null;
  archiveReason?: string | null;
  messages: ReportMessage[];
  attachments: ReportAttachment[];
  moderatorNotes?: ReportModeratorNote[];
}

export interface ReportListResponse {
  items: ReportSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReportStats {
  total: number;
  byStatus: Record<ReportStatus, number>;
  byType: Record<ReportType, number>;
  overdue: number;
  avgResolutionHours: number | null;
}

export interface ReportBanInfo {
  id: string;
  userId: string;
  reason: string;
  bannedBy: string;
  bannedUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UserSearchHint {
  id: string;
  username: string;
  exists: boolean;
}
