'use client';

import type { NewsAuthor } from '@twomc/shared';
import Image from 'next/image';
import Link from 'next/link';
import { ColoredUsername } from '@/components/shared/ColoredUsername';

interface NewsAuthorInfoProps {
  author: NewsAuthor;
}

export function NewsAuthorInfo({ author }: NewsAuthorInfoProps) {
  return (
    <Link href={`/users/${author.username}`} className="inline-flex items-center gap-2 transition-opacity hover:opacity-80">
      {author.avatar ? (
        <Image
          src={author.avatar}
          alt={author.username}
          width={36}
          height={36}
          className="rounded-full"
          unoptimized
        />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm">
          {author.username.slice(0, 1).toUpperCase()}
        </span>
      )}
      <ColoredUsername user={author} size="md" showBadge badges={author.badges} linkToProfile={false} />
    </Link>
  );
}
