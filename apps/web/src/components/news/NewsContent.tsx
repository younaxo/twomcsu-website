'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';

interface NewsContentProps {
  content: string;
  className?: string;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
}

export function NewsContent({ content, className }: NewsContentProps) {
  return (
    <div
      className={cn(
        'prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-a:text-primary prose-img:rounded-xl',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h2: ({ children, ...props }) => {
            const text = String(children);
            return (
              <h2 id={slugifyHeading(text)} {...props}>
                {children}
              </h2>
            );
          },
          h3: ({ children, ...props }) => {
            const text = String(children);
            return (
              <h3 id={slugifyHeading(text)} {...props}>
                {children}
              </h3>
            );
          },
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          img: ({ src, alt }) =>
            src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ''} className="h-auto max-w-full rounded-xl" />
            ) : null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function extractToc(content: string): Array<{ id: string; text: string; level: 2 | 3 }> {
  const lines = content.split('\n');
  const items: Array<{ id: string; text: string; level: 2 | 3 }> = [];

  for (const line of lines) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[#*_`]/g, '').trim();
    items.push({ id: slugifyHeading(text), text, level });
  }

  return items;
}
