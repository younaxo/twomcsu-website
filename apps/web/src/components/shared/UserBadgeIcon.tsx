'use client';

import { UserBadgeType } from '@twomc/shared';
import Image from 'next/image';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { userBadgeIcons, userBadgeLabels } from '@/lib/profile';
import { cn } from '@/lib/utils';

interface UserBadgeIconProps {
  type: UserBadgeType;
  size?: number;
  className?: string;
}

function UserBadgeIconComponent({ type, size = 20, className }: UserBadgeIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex shrink-0 cursor-help', className)}>
          <Image src={userBadgeIcons[type]} alt={userBadgeLabels[type]} width={size} height={size} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{userBadgeLabels[type]}</TooltipContent>
    </Tooltip>
  );
}

export const UserBadgeIcon = memo(UserBadgeIconComponent);
