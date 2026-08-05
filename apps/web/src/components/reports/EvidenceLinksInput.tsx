'use client';

import { detectEvidenceLinkType } from '@twomc/shared';
import { ExternalLink, HardDrive, ImageIcon, Play, Tv, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type EvidenceLinkDraft = {
  url: string;
  title: string;
};

const MAX_LINKS = 10;

function TypeIcon({ url }: { url: string }) {
  const type = detectEvidenceLinkType(url);
  const className = 'h-4 w-4 shrink-0 text-[#F57C00]';

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

function emptyDraft(): EvidenceLinkDraft {
  return { url: '', title: '' };
}

export function EvidenceLinksInput({
  value,
  onChange,
  label,
  required,
  hint,
  className,
}: {
  value: EvidenceLinkDraft[];
  onChange: (links: EvidenceLinkDraft[]) => void;
  label?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  const rows = value.length > 0 ? value : [emptyDraft()];

  const updateRow = (index: number, patch: Partial<EvidenceLinkDraft>) => {
    const next = [...rows];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [emptyDraft()]);
  };

  const addRow = () => {
    if (rows.length >= MAX_LINKS) return;
    onChange([...rows, emptyDraft()]);
  };

  return (
    <div className={className}>
      {label ? (
        <Label>
          {label}
          {required ? ' *' : ''}
        </Label>
      ) : null}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}

      <div className="mt-3 space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="space-y-2 rounded-xl glass-light p-3">
            <div className="flex gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <TypeIcon url={row.url} />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  value={row.url}
                  onChange={(event) => updateRow(index, { url: event.target.value })}
                  placeholder="https://youtube.com/..."
                />
                <Input
                  value={row.title}
                  onChange={(event) => updateRow(index, { title: event.target.value })}
                  placeholder="Название (необязательно)"
                />
              </div>
              {rows.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => removeRow(index)}
                  aria-label="Удалить ссылку"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {rows.length < MAX_LINKS ? (
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={addRow}>
          + Добавить ссылку
        </Button>
      ) : null}

      <p className={cn('mt-1 text-xs text-muted-foreground')}>
        {rows.filter((row) => row.url.trim()).length} / {MAX_LINKS}
      </p>
    </div>
  );
}

export function getValidEvidenceLinks(links: EvidenceLinkDraft[]): EvidenceLinkDraft[] {
  return links
    .map((link) => ({ url: link.url.trim(), title: link.title.trim() }))
    .filter((link) => link.url.length > 0);
}
