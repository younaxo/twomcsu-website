'use client';

import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from '@/hooks/store';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  inWishlist?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'icon';
}

export function WishlistButton({
  productId,
  inWishlist: inWishlistProp,
  className,
  size = 'icon',
}: WishlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const wishlist = useWishlist(isAuthenticated);
  const add = useAddToWishlist();
  const remove = useRemoveFromWishlist();

  const fromList = wishlist.data?.items.some((item) => item.product.id === productId);
  const active = inWishlistProp ?? fromList ?? false;
  const busy = add.isPending || remove.isPending;

  const toggle = async () => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы добавить в избранное');
      return;
    }

    try {
      if (active) {
        await remove.mutateAsync(productId);
        toast.success('Убрано из избранного');
      } else {
        await add.mutateAsync(productId);
        toast.success('Добавлено в избранное');
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обновить избранное'));
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size}
          className={cn(active && 'border-primary text-primary', className)}
          disabled={busy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggle();
          }}
        >
          <Heart className={cn('h-4 w-4', active && 'fill-current')} />
          {size !== 'icon' ? (
            <span>{active ? 'В избранном' : 'В избранное'}</span>
          ) : null}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {active ? 'Убрать из избранного' : 'Добавить в избранное'}
      </TooltipContent>
    </Tooltip>
  );
}
