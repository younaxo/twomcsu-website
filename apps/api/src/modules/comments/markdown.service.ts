import { Injectable } from '@nestjs/common';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class MarkdownService {
  private readonly allowedTags = [
    'b',
    'i',
    'strong',
    'em',
    's',
    'del',
    'code',
    'pre',
    'blockquote',
    'ul',
    'ol',
    'li',
    'p',
    'br',
    'a',
    'span',
    'h1',
    'h2',
    'h3',
    'h4',
    'img',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ];

  render(markdown: string): string {
    const withSpoilers = markdown.replace(/\|\|(.+?)\|\|/gs, '<span class="spoiler">$1</span>');
    const withMentions = withSpoilers.replace(
      /@([A-Za-z0-9_]{3,16})\b/g,
      '<a class="mention" href="/users/$1" data-username="$1">@$1</a>',
    );

    const rawHtml = marked.parse(withMentions, {
      async: false,
      gfm: true,
      breaks: true,
    }) as string;

    return sanitizeHtml(rawHtml, {
      allowedTags: this.allowedTags,
      allowedAttributes: {
        a: ['href', 'rel', 'target', 'class', 'data-username'],
        span: ['class', 'data-username'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        h1: ['id'],
        h2: ['id'],
        h3: ['id'],
        h4: ['id'],
        th: ['colspan', 'rowspan'],
        td: ['colspan', 'rowspan'],
      },
      allowedClasses: {
        span: ['spoiler', 'mention'],
        a: ['mention'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      transformTags: {
        a: (tagName, attribs) => {
          const href = attribs.href ?? '';
          const isMention = href.startsWith('/users/') || attribs.class === 'mention';
          return {
            tagName,
            attribs: {
              ...attribs,
              ...(isMention
                ? { rel: 'noopener noreferrer' }
                : { rel: 'noopener noreferrer', target: '_blank' }),
            },
          };
        },
      },
    });
  }
}
