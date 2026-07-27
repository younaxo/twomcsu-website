'use client';

import type { Award } from '@twomc/shared';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { rarityBorder } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface AwardIconProps {
  award: Pick<Award, 'name' | 'description' | 'iconUrl' | 'rarity'>;
  size?: number;
  className?: string;
}

export function AwardIcon({ award, size = 32, className }: AwardIconProps) {
  const border = award.rarity ? rarityBorder[award.rarity] : undefined;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex rounded-md border border-transparent p-0.5',
              border,
              className,
            )}
          >
            <Image
              src={award.iconUrl}
              alt={award.name}
              width={size}
              height={size}
              className="object-contain"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-56">
          <p className="font-medium">{award.name}</p>
          {award.description ? (
            <p className="text-primary-foreground/80">{award.description}</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
