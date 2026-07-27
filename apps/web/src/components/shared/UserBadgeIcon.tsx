'use client';

import { UserBadgeType } from '@twomc/shared';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { userBadgeIcons, userBadgeLabels } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface UserBadgeIconProps {
  type: UserBadgeType;
  size?: number;
  className?: string;
}

export function UserBadgeIcon({ type, size = 20, className }: UserBadgeIconProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex shrink-0', className)}>
            <Image src={userBadgeIcons[type]} alt={userBadgeLabels[type]} width={size} height={size} />
          </span>
        </TooltipTrigger>
        <TooltipContent>{userBadgeLabels[type]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
