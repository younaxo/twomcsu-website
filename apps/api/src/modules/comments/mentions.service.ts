import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MENTION_REGEX = /@([A-Za-z0-9_]{3,16})\b/g;

@Injectable()
export class MentionsService {
  constructor(private readonly prisma: PrismaService) {}

  extractUsernames(content: string): string[] {
    const usernames = new Set<string>();

    for (const match of content.matchAll(MENTION_REGEX)) {
      usernames.add(match[1].toLowerCase());
    }

    return [...usernames];
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
}
