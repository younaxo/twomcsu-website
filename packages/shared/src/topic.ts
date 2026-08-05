export const TopicCategory = {
  RULES: 'RULES',
  DOCUMENTS: 'DOCUMENTS',
  INFORMATION: 'INFORMATION',
  ADMIN_INTERNAL: 'ADMIN_INTERNAL',
  FAQ: 'FAQ',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  OTHER: 'OTHER',
} as const;

export type TopicCategory = (typeof TopicCategory)[keyof typeof TopicCategory];

export const TopicVisibility = {
  PUBLIC: 'PUBLIC',
  AUTHENTICATED: 'AUTHENTICATED',
  HELPER_ONLY: 'HELPER_ONLY',
  MODERATOR_ONLY: 'MODERATOR_ONLY',
  ADMIN_ONLY: 'ADMIN_ONLY',
  OWNER_ONLY: 'OWNER_ONLY',
} as const;

export type TopicVisibility = (typeof TopicVisibility)[keyof typeof TopicVisibility];

export const TOPIC_PLACEHOLDER_CONTENT =
  'Здесь будет текст. Владелец сайта заполнит этот раздел.';

export interface TopicAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface TopicSummary {
  id: string;
  slug: string;
  title: string;
  category: TopicCategory;
  visibility: TopicVisibility;
  icon: string | null;
  color: string | null;
  description: string | null;
  order: number;
  isActive: boolean;
  isPinned: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicDetails extends TopicSummary {
  content: string;
  contentHtml: string | null;
  createdBy: string;
  updatedBy: string | null;
  attachments: TopicAttachment[];
}
