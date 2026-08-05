'use client';

import type { ReportEvidenceLink } from '@twomc/shared';
import { EvidenceLinkCard } from '@/components/reports/EvidenceLinkCard';
import { cn } from '@/lib/utils';

function isEvidenceLinkObject(
  item: string | ReportEvidenceLink,
): item is ReportEvidenceLink {
  return typeof item === 'object' && item !== null && 'url' in item;
}

export function EvidenceLinks({
  links,
  className,
}: {
  links: string[] | ReportEvidenceLink[];
  className?: string;
}) {
  if (links.length === 0) {
    return null;
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {links.map((link, index) => {
        const item = isEvidenceLinkObject(link)
          ? link
          : { id: `legacy-${index}`, url: link, title: null, type: null, order: index, createdAt: '' };

        return (
          <li key={isEvidenceLinkObject(link) ? link.id : `${link}-${index}`}>
            <EvidenceLinkCard link={item} />
          </li>
        );
      })}
    </ul>
  );
}
