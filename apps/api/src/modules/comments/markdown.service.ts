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
  ];

  render(markdown: string): string {
    const withSpoilers = markdown.replace(/\|\|(.+?)\|\|/gs, '<span class="spoiler">$1</span>');

    const rawHtml = marked.parse(withSpoilers, {
      async: false,
      gfm: true,
      breaks: true,
    }) as string;

    return sanitizeHtml(rawHtml, {
      allowedTags: this.allowedTags,
      allowedAttributes: {
        a: ['href', 'rel', 'target'],
        span: ['class'],
      },
      allowedClasses: {
        span: ['spoiler', 'mention'],
      },
      allowedSchemes: ['http', 'https'],
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', {
          rel: 'noopener noreferrer',
          target: '_blank',
        }),
      },
    });
  }
}
