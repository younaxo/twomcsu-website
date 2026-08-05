'use client';

import type { TopicDetails } from '@twomc/shared';
import { RoleGroup, TopicVisibility, hasRoleGroup } from '@twomc/shared';
import { Download, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { resolveMediaUrl } from '@/lib/profile';
import {
  extractMarkdownHeadings,
  TOPIC_CATEGORY_LABELS,
  TOPIC_VISIBILITY_LABELS,
} from '@/lib/topic';
import { cn } from '@/lib/utils';

interface TopicViewerProps {
  topic: TopicDetails;
}

export function TopicViewer({ topic }: TopicViewerProps) {
  const { user } = useAuth();
  const isOwner = user ? hasRoleGroup(user.roleGroup, RoleGroup.OWNER) : false;
  const headings = useMemo(() => extractMarkdownHeadings(topic.content), [topic.content]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
      <article className="min-w-0 space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{TOPIC_CATEGORY_LABELS[topic.category]}</Badge>
            {topic.visibility !== TopicVisibility.PUBLIC ? (
              <Badge variant="outline">{TOPIC_VISIBILITY_LABELS[topic.visibility]}</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-3xl font-semibold text-white">{topic.title}</h1>
            {isOwner ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/topics/${topic.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </Link>
              </Button>
            ) : null}
          </div>
          {topic.description ? (
            <p className="text-muted-foreground">{topic.description}</p>
          ) : null}
        </header>

        <MarkdownContent
          content={topic.content}
          className={cn(
            'rounded-2xl glass-medium p-6',
            'prose-headings:scroll-mt-24 prose-a:text-primary',
          )}
        />

        {topic.attachments.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-medium text-white">Вложения</h2>
            <ul className="space-y-2">
              {topic.attachments.map((file) => {
                const url = resolveMediaUrl(file.fileUrl) ?? file.fileUrl;
                return (
                  <li key={file.id}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/5"
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <span>{file.fileName}</span>
                      <span className="text-muted-foreground">
                        ({Math.round(file.fileSize / 1024)} КБ)
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </article>

      {headings.length > 0 ? (
        <aside className="hidden lg:block">
          <nav className="sticky top-24 rounded-xl glass-medium p-4">
            <p className="mb-3 text-sm font-medium text-white">Содержание</p>
            <ul className="space-y-2 text-sm">
              {headings.map((heading) => (
                <li
                  key={heading.id}
                  className={cn(heading.level === 3 && 'pl-3')}
                >
                  <a
                    href={`#${heading.id}`}
                    className="text-muted-foreground transition-colors hover:text-white"
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      ) : null}
    </div>
  );
}
