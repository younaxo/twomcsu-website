'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CopyableAddressProps {
  address: string;
  port: number;
  className?: string;
}

export function CopyableAddress({ address, port, className }: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);
  const value = `${address}:${port}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Скопировано');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 font-mono text-sm text-white',
        className,
      )}
    >
      <span className="truncate">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => void copy()}
        aria-label="Скопировать адрес"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
