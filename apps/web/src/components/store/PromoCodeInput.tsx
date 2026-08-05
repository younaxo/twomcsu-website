'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApplyPromoCode, useRemovePromoCode } from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PromoCodeInputProps {
  appliedCode?: string | null;
  className?: string;
}

export function PromoCodeInput({ appliedCode, className }: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const apply = useApplyPromoCode();
  const remove = useRemovePromoCode();

  const submit = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    try {
      await apply.mutateAsync(trimmed);
      toast.success('Промокод применён');
      setCode('');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Промокод недействителен'));
    }
  };

  const clear = async () => {
    try {
      await remove.mutateAsync();
      toast.success('Промокод убран');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось убрать промокод'));
    }
  };

  if (appliedCode) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm',
          className,
        )}
      >
        <span>
          Промокод <span className="font-medium text-primary">{appliedCode}</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={remove.isPending}
          onClick={() => void clear()}
        >
          Убрать
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        placeholder="Промокод"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={apply.isPending || !code.trim()}
        onClick={() => void submit()}
      >
        Применить
      </Button>
    </div>
  );
}
