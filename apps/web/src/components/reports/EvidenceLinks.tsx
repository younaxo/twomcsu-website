'use client';

import { ExternalLink, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

function isVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|medal\.tv|streamable\.com/i.test(url);
}

export function EvidenceLinks({
  links,
  className,
}: {
  links: string[];
  className?: string;
}) {
  if (links.length === 0) {
    return null;
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {links.map((link) => {
        const video = isVideoUrl(link);
        return (
          <li key={link}>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg glass-light px-3 py-2 text-sm text-primary transition hover:bg-white/10"
            >
              {video ? <Play className="h-4 w-4 shrink-0" /> : <ExternalLink className="h-4 w-4 shrink-0" />}
              <span className="truncate">{link}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
