'use client';

import {
  detectEvidenceLinkType,
  type ReportEvidenceLink,
} from '@twomc/shared';
import { ExternalLink, HardDrive, ImageIcon, Play, Tv } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop() ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function EvidenceTypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'youtube':
      return <Play className={className} />;
    case 'twitch':
      return <Tv className={className} />;
    case 'imgur':
      return <ImageIcon className={className} />;
    case 'google_drive':
      return <HardDrive className={className} />;
    default:
      return <ExternalLink className={className} />;
  }
}

export function EvidenceLinkCard({
  link,
  className,
}: {
  link: ReportEvidenceLink | { url: string; title?: string | null; type?: string | null };
  className?: string;
}) {
  const type = link.type ?? detectEvidenceLinkType(link.url);
  const label = link.title?.trim() || link.url;
  const youtubeId = type === 'youtube' ? extractYoutubeId(link.url) : null;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex gap-3 rounded-xl glass-light p-3 transition hover:bg-white/10',
        className,
      )}
    >
      {youtubeId ? (
        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-black/40">
          <Image
            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-6 w-6 text-white" />
          </div>
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#F57C00]">
          <EvidenceTypeIcon type={type} className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white group-hover:text-[#F57C00]">
          {label}
        </p>
        {link.title ? (
          <p className="truncate text-xs text-muted-foreground">{link.url}</p>
        ) : null}
      </div>

      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
    </a>
  );
}
