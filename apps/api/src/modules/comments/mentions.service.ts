import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const MENTION_REGEX = /@([A-Za-z0-9_]{3,16})\b/g;

export type MentionNotificationType =
  | typeof NotificationType.COMMENT_MENTION
  | typeof NotificationType.CHAT_MENTION
  | typeof NotificationType.NEWS_COMMENT_MENTION
  | typeof NotificationType.REPORT_MENTION;

@Injectable()
export class MentionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  extractUsernames(content: string): string[] {
    const usernames = new Set<string>();

    for (const match of content.matchAll(MENTION_REGEX)) {
      usernames.add(match[1].toLowerCase());
    }

    return [...usernames];
  }

  /** Resolve @usernames in markdown to user ids */
  async parseMentions(content: string): Promise<string[]> {
    return this.resolveMentionIds(content);
  }

  async resolveMentionIds(content: string): Promise<string[]> {
    const usernames = this.extractUsernames(content);

    if (usernames.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: usernames.map((username) => ({
          username: { equals: username, mode: 'insensitive' as const },
        })),
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  async notifyMentions(options: {
    content: string;
    authorId: string;
    type: MentionNotificationType;
    title: string;
    message: string;
    link: string;
    metadata?: Record<string, unknown>;
    excludeUserIds?: string[];
  }): Promise<string[]> {
    const mentionIds = await this.parseMentions(options.content);
    const excluded = new Set([options.authorId, ...(options.excludeUserIds ?? [])]);
    const targets = mentionIds.filter((id) => !excluded.has(id));

    if (targets.length === 0) {
      return mentionIds;
    }

    const mentioned = await this.prisma.user.findMany({
      where: {
        id: { in: targets },
        notifyOnMention: true,
      },
      select: { id: true },
    });

    await Promise.all(
      mentioned.map((user) =>
        this.notifications.createNotification({
          userId: user.id,
          type: options.type,
          title: options.title,
          message: options.message,
          link: options.link,
          fromUserId: options.authorId,
          metadata: options.metadata,
        }),
      ),
    );

    return mentionIds;
  }
}
