import {
  Topic as TopicRow,
  TopicAttachment as TopicAttachmentRow,
} from '@prisma/client';
import { TopicAttachment, TopicDetails, TopicSummary } from '@twomc/shared';

export function toTopicAttachment(row: TopicAttachmentRow): TopicAttachment {
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

export function toTopicSummary(row: TopicRow): TopicSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    visibility: row.visibility,
    icon: row.icon,
    color: row.color,
    description: row.description,
    order: row.order,
    isActive: row.isActive,
    isPinned: row.isPinned,
    views: row.views,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toTopicDetails(
  row: TopicRow & { attachments: TopicAttachmentRow[] },
): TopicDetails {
  return {
    ...toTopicSummary(row),
    content: row.content,
    contentHtml: row.contentHtml,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    attachments: row.attachments.map(toTopicAttachment),
  };
}
