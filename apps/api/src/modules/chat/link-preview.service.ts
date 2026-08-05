import { Injectable } from '@nestjs/common';
import type { ChatLinkPreview } from '@twomc/shared';

@Injectable()
export class LinkPreviewService {
  private readonly urlRegex = /https?:\/\/[^\s<>"']+/gi;

  extract(content: string): ChatLinkPreview[] {
    const urls = content.match(this.urlRegex) ?? [];
    const unique = [...new Set(urls)].slice(0, 3);
    return unique.map((url) => this.parseUrl(url)).filter(Boolean) as ChatLinkPreview[];
  }

  private parseUrl(url: string): ChatLinkPreview | null {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '').toLowerCase();

      if (host === 'youtube.com' || host === 'm.youtube.com') {
        const id = u.searchParams.get('v');
        if (id) return { url, type: 'youtube', embedId: id };
      }
      if (host === 'youtu.be') {
        const id = u.pathname.slice(1);
        if (id) return { url, type: 'youtube', embedId: id };
      }
      if (host === 'twitch.tv' || host.endsWith('.twitch.tv')) {
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts[0] === 'videos' && parts[1]) {
          return { url, type: 'twitch', embedId: `video=${parts[1]}` };
        }
        if (parts[0] === 'clip' || parts[0] === 'clips') {
          return { url, type: 'twitch', embedId: `clip=${parts[1] ?? parts[0]}` };
        }
        if (parts[0]) return { url, type: 'twitch', embedId: `channel=${parts[0]}` };
      }
      if (host === 'imgur.com' || host === 'i.imgur.com') {
        return { url, type: 'imgur', imageUrl: url };
      }

      return { url, type: 'og' };
    } catch {
      return null;
    }
  }
}
