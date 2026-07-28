'use client';

import type { ProductVariant } from '@twomc/shared';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatDuration, formatPrice, discountPercent } from '@/lib/store';
import { cn } from '@/lib/utils';

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  value: string;
  onChange: (variantId: string) => void;
  className?: string;
}

export function ProductVariantSelector({
  variants,
  value,
  onChange,
  className,
}: ProductVariantSelectorProps) {
  const active = variants.filter((v) => v.isActive).sort((a, b) => a.order - b.order);

  if (active.length === 0) return null;

  return (
    <RadioGroup value={value} onValueChange={onChange} className={cn('space-y-2', className)}>
      {active.map((variant) => {
        const discount = discountPercent(variant.price, variant.oldPrice);
        return (
          <Label
            key={variant.id}
            htmlFor={variant.id}
            className={cn(
              'flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-accent/50',
              value === variant.id && 'border-primary bg-primary/10',
            )}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value={variant.id} id={variant.id} />
              <span>{formatDuration(variant.duration)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {variant.oldPrice && variant.oldPrice > variant.price ? (
                <span className="text-muted-foreground line-through">
                  {formatPrice(variant.oldPrice)}
                </span>
              ) : null}
              <span className="font-medium text-white">{formatPrice(variant.price)}</span>
              {discount ? (
                <span className="text-xs text-primary">−{discount}%</span>
              ) : null}
            </div>
          </Label>
        );
      })}
    </RadioGroup>
  );
}
