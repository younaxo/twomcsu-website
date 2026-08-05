'use client';

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Smile } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCustomEmojis } from '@/hooks/markdown';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EmojiPickerProps {
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

type EmojiMartSelection = {
  id?: string;
  native?: string;
  shortcodes?: string;
};

export function EmojiPickerButton({ onSelect, disabled, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { data: customEmojis = [] } = useCustomEmojis();

  const custom = useMemo(
    () =>
      customEmojis.map((emoji) => ({
        id: emoji.name,
        name: emoji.name,
        keywords: [emoji.name, emoji.category ?? 'twomc'],
        skins: [{ src: emoji.imageUrl }],
      })),
    [customEmojis],
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-50"
              onClick={() => setOpen((value) => !value)}
              aria-label="Эмодзи"
            >
              <Smile className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Эмодзи</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {open ? (
        <div className="absolute bottom-full right-0 z-50 mb-2 overflow-hidden rounded-xl border border-white/10 shadow-2xl">
          <Picker
            data={data}
            theme="dark"
            locale="ru"
            previewPosition="none"
            skinTonePosition="search"
            navPosition="bottom"
            perLine={8}
            maxFrequentRows={2}
            custom={[{ id: 'twomc', name: 'TWOMC', emojis: custom }]}
            categories={[
              'frequent',
              'custom-twomc',
              'people',
              'nature',
              'foods',
              'activity',
              'places',
              'objects',
              'symbols',
              'flags',
            ]}
            onEmojiSelect={(emoji: EmojiMartSelection) => {
              const customMatch = customEmojis.find((item) => item.name === emoji.id);
              if (customMatch) {
                onSelect(`:${customMatch.name}:`);
              } else if (emoji.native) {
                onSelect(emoji.native);
              }
              setOpen(false);
            }}
            style={{ width: 352, height: 435 }}
          />
        </div>
      ) : null}
    </div>
  );
}
