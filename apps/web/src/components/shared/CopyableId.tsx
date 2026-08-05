'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CopyableIdProps {
  label: string;
  value: string;
  display?: string;
  className?: string;
}

export function CopyableId({ label, value, display, className }: CopyableIdProps) {
  const shown = display ?? value;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Скопировано');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="text-muted-foreground">{label}:</span>
      <code className="rounded bg-secondary/80 px-1.5 py-0.5 font-mono text-xs text-foreground">
        {shown}
      </code>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => void copy()}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Скопировать</TooltipContent>
      </Tooltip>
    </div>
  );
}
