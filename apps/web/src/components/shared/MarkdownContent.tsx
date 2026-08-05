'use client';

import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import Link from 'next/link';
import { Children, useMemo, useState, type ReactNode } from 'react';
import { MentionHoverCard } from '@/components/shared/MentionHoverCard';
import { useCustomEmojis } from '@/hooks/markdown';
import { cn } from '@/lib/utils';

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), ['className'], ['class']],
    img: [...(defaultSchema.attributes?.img ?? []), ['src'], ['alt'], ['title'], ['width'], ['height']],
    a: [...(defaultSchema.attributes?.a ?? []), ['href'], ['target'], ['rel']],
    code: [...(defaultSchema.attributes?.code ?? []), ['className'], ['class']],
  },
};

interface MarkdownContentProps {
  content: string;
  className?: string;
  /** When content is already sanitized HTML from API */
  html?: string;
}

const MENTION_RE = /@([A-Za-z0-9_]{3,16})\b/g;
const SPOILER_RE = /\|\|(.+?)\|\|/gs;
const CUSTOM_EMOJI_RE = /:([a-z0-9-]+):/gi;

export function MarkdownContent({ content, className, html }: MarkdownContentProps) {
  const { data: customEmojis = [] } = useCustomEmojis();
  const emojiMap = useMemo(
    () => new Map(customEmojis.map((emoji) => [emoji.name.toLowerCase(), emoji.imageUrl])),
    [customEmojis],
  );

  const prepared = useMemo(
    () => preprocessMarkdown(content, emojiMap),
    [content, emojiMap],
  );

  if (html) {
    return (
      <div
        className={cn('comment-markdown prose prose-invert max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleSpoilerClick}
      />
    );
  }

  const components: Components = {
    a: ({ href, children }) => {
      if (href?.startsWith('/users/')) {
        const username = href.replace('/users/', '');
        return (
          <MentionHoverCard username={username}>
            <Link
              href={href}
              className="mention font-semibold no-underline"
              style={{ color: 'inherit' }}
            >
              {children}
            </Link>
          </MentionHoverCard>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    img: ({ src, alt }) => {
      if (!src) return null;
      const isCustomEmoji = src.includes('/emojis/custom/') || alt?.startsWith('emoji:');
      if (isCustomEmoji) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt?.replace(/^emoji:/, '') ?? ''}
            className="inline-block h-5 w-5 align-text-bottom"
            loading="lazy"
          />
        );
      }
      return <MarkdownImage src={src} alt={alt ?? ''} />;
    },
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[#F57C00] pl-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
    code: ({ className: codeClass, children, ...props }) => {
      const isBlock = Boolean(codeClass);
      if (isBlock) {
        return (
          <code className={cn('block overflow-x-auto rounded-lg bg-black/40 p-3 text-sm', codeClass)} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="rounded bg-black/40 px-1.5 py-0.5 text-[0.9em]" {...props}>
          {children}
        </code>
      );
    },
    p: ({ children }) => <p>{enrichNodes(children, emojiMap)}</p>,
    li: ({ children }) => <li>{enrichNodes(children, emojiMap)}</li>,
    td: ({ children }) => <td>{enrichNodes(children, emojiMap)}</td>,
    th: ({ children }) => <th>{enrichNodes(children, emojiMap)}</th>,
  };

  return (
    <div className={cn('comment-markdown prose prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {prepared}
      </ReactMarkdown>
    </div>
  );
}

function preprocessMarkdown(content: string, emojiMap: Map<string, string>): string {
  let result = content;

  result = result.replace(CUSTOM_EMOJI_RE, (match, name: string) => {
    const url = emojiMap.get(name.toLowerCase());
    if (!url) return match;
    return `![emoji:${name}](${url})`;
  });

  result = result.replace(MENTION_RE, '[@$1](/users/$1)');

  // Spoilers become inline code markers processed in enrichNodes if still present;
  // convert to markdown emphasis wrappers that survive sanitize via custom handling
  result = result.replace(SPOILER_RE, '`$SPOILER$1$`');

  return result;
}

function enrichNodes(children: ReactNode, emojiMap: Map<string, string>): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') {
      return enrichText(child, emojiMap);
    }
    return child;
  });
}

function enrichText(text: string, _emojiMap: Map<string, string>): ReactNode {
  if (text.startsWith('$SPOILER') && text.endsWith('$')) {
    const inner = text.slice('$SPOILER'.length, -1);
    return <Spoiler>{inner}</Spoiler>;
  }

  // Fallback: inline spoilers / mentions that weren't preprocessed
  const parts: ReactNode[] = [];
  const combined = /(@[A-Za-z0-9_]{3,16}\b)|\|\|(.+?)\|\|/gs;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = combined.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1]) {
      const username = match[1].slice(1);
      parts.push(
        <MentionHoverCard key={`m-${key++}`} username={username}>
          <Link href={`/users/${username}`} className="mention font-semibold no-underline">
            @{username}
          </Link>
        </MentionHoverCard>,
      );
    } else if (match[2] !== undefined) {
      parts.push(<Spoiler key={`s-${key++}`}>{match[2]}</Spoiler>);
    }
    last = match.index + match[0].length;
  }

  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Spoiler({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      role="button"
      tabIndex={0}
      className={cn('spoiler', revealed && 'revealed')}
      onClick={() => setRevealed(true)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setRevealed(true);
        }
      }}
    >
      {children}
    </span>
  );
}

function MarkdownImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-auto max-w-full cursor-zoom-in rounded-xl"
        onClick={() => setOpen(true)}
      />
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-full max-w-full rounded-xl" />
        </button>
      ) : null}
    </>
  );
}

function handleSpoilerClick(event: React.MouseEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement | null;
  if (target?.classList.contains('spoiler')) {
    target.classList.add('revealed');
  }
}
