'use client';

import type { TopicSummary } from '@twomc/shared';
import { TopicVisibility } from '@twomc/shared';
import { Eye, Pin } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { TOPIC_CATEGORY_LABELS, TOPIC_VISIBILITY_LABELS } from '@/lib/topic';
import { cn } from '@/lib/utils';

interface TopicCardProps {
  topic: TopicSummary;
  hrefPrefix: string;
}

export function TopicCard({ topic, hrefPrefix }: TopicCardProps) {
  return (
    <Link
      href={`${hrefPrefix}/${topic.slug}`}
      className={cn(
        'group flex flex-col gap-3 rounded-xl glass-medium p-5 transition-colors duration-200 hover:bg-white/10',
        topic.color ? 'border-l-4' : undefined,
      )}
      style={topic.color ? { borderLeftColor: topic.color } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {topic.icon ? (
            <span className="text-2xl leading-none" aria-hidden>
              {topic.icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-white group-hover:text-primary">
                {topic.title}
              </h2>
              {topic.isPinned ? (
                <Pin className="h-4 w-4 shrink-0 text-amber-400" aria-label="Закреплено" />
              ) : null}
            </div>
            {topic.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{topic.description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary">{TOPIC_CATEGORY_LABELS[topic.category]}</Badge>
        {topic.visibility !== TopicVisibility.PUBLIC ? (
          <Badge variant="outline">{TOPIC_VISIBILITY_LABELS[topic.visibility]}</Badge>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {topic.views}
        </span>
      </div>
    </Link>
  );
}
