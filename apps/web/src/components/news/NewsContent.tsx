'use client';

import { MarkdownContent } from '@/components/shared/MarkdownContent';

interface NewsContentProps {
  content: string;
  className?: string;
}

export function NewsContent({ content, className }: NewsContentProps) {
  return <MarkdownContent content={content} className={className} />;
}

export function extractToc(content: string): Array<{ id: string; text: string; level: 2 | 3 }> {
  const lines = content.split('\n');
  const items: Array<{ id: string; text: string; level: 2 | 3 }> = [];

  for (const line of lines) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[#*_`]/g, '').trim();
    items.push({
      id: text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, ''),
      text,
      level,
    });
  }

  return items;
}
