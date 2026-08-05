'use client';

import { Heart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLikeNews } from '@/hooks/news';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NewsLikeButtonProps {
  newsId: string;
  likesCount: number;
  likedByMe?: boolean;
  size?: 'default' | 'lg';
  className?: string;
}

export function NewsLikeButton({
  newsId,
  likesCount,
  likedByMe = false,
  size = 'default',
  className,
}: NewsLikeButtonProps) {
  const { user } = useAuth();
  const like = useLikeNews();
  const [liked, setLiked] = useState(likedByMe);
  const [count, setCount] = useState(likesCount);

  const onClick = async () => {
    if (!user) {
      toast.error('Войдите, чтобы поставить лайк');
      return;
    }

    try {
      const result = await like.mutateAsync(newsId);
      setLiked(result.liked);
      setCount(result.likesCount);
    } catch {
      toast.error('Не удалось обновить лайк');
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size={size === 'lg' ? 'lg' : 'default'}
          onClick={onClick}
          disabled={like.isPending}
          className={cn('gap-2', className)}
        >
          <Heart
            className={cn(
              'transition-colors',
              size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
              liked && 'fill-red-500 text-red-500',
            )}
          />
          <span className="tabular-nums">{count}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{liked ? 'Убрать лайк' : 'Нравится'}</TooltipContent>
    </Tooltip>
  );
}
