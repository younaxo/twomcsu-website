import type { Position } from '@twomc/shared';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type BadgeSize = 'sm' | 'md' | 'lg';

interface PositionBadgeProps {
  position: Position;
  size?: BadgeSize;
  showIcon?: boolean;
  className?: string;
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'gap-1 px-1.5 py-0.5 text-[11px]',
  md: 'gap-1.5 px-2 py-0.5 text-xs',
  lg: 'gap-2 px-3 py-1 text-sm',
};

const iconSizes: Record<BadgeSize, number> = { sm: 12, md: 14, lg: 18 };

const FILL_ALPHA = '1f';
const BORDER_ALPHA = '4d';

function PositionBadgeComponent({
  position,
  size = 'md',
  showIcon = true,
  className,
}: PositionBadgeProps) {
  const icon = showIcon ? position.icon : null;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center whitespace-nowrap rounded-full border font-medium leading-none',
            sizeClasses[size],
            className,
          )}
          style={{
            color: position.color,
            backgroundColor: position.backgroundColor ?? `${position.color}${FILL_ALPHA}`,
            borderColor: `${position.color}${BORDER_ALPHA}`,
          }}
        >
          {icon ? <PositionIcon icon={icon} size={iconSizes[size]} /> : null}
          {position.displayName}
        </span>
      </TooltipTrigger>
      <TooltipContent>Префикс: {position.displayName}</TooltipContent>
    </Tooltip>
  );
}

function PositionIcon({ icon, size }: { icon: string; size: number }) {
  if (icon.startsWith('http') || icon.startsWith('/')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon} alt="" width={size} height={size} className="rounded-sm object-contain" />
    );
  }

  return <span aria-hidden>{icon}</span>;
}

export const PositionBadge = memo(PositionBadgeComponent);
