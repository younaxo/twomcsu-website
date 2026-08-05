'use client';

import data from '@emoji-mart/data';
import { useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useCustomEmojis } from './useCustomEmojis';

export interface EmojiSearchItem {
  id: string;
  name: string;
  native?: string;
  src?: string;
  isCustom: boolean;
}

type EmojiMartEmoji = {
  id: string;
  name: string;
  skins: Array<{ native: string }>;
  keywords?: string[];
};

type EmojiMartData = {
  emojis: Record<string, EmojiMartEmoji>;
};

const emojiData = data as EmojiMartData;

export function useEmojiSearch(query: string, enabled = true) {
  const [debounced] = useDebounce(query.trim().toLowerCase(), 200);
  const { data: customEmojis = [] } = useCustomEmojis(enabled);

  const results = useMemo(() => {
    if (!enabled || debounced.length < 2) {
      return [] as EmojiSearchItem[];
    }

    const customMatches: EmojiSearchItem[] = customEmojis
      .filter((emoji) => emoji.name.includes(debounced) || emoji.name.startsWith(debounced))
      .slice(0, 8)
      .map((emoji) => ({
        id: emoji.id,
        name: emoji.name,
        src: emoji.imageUrl,
        isCustom: true,
      }));

    const standardMatches: EmojiSearchItem[] = [];
    for (const emoji of Object.values(emojiData.emojis)) {
      const haystack = [emoji.id, emoji.name, ...(emoji.keywords ?? [])]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(debounced)) continue;
      standardMatches.push({
        id: emoji.id,
        name: emoji.id,
        native: emoji.skins[0]?.native,
        isCustom: false,
      });
      if (standardMatches.length >= 8) break;
    }

    return [...customMatches, ...standardMatches].slice(0, 8);
  }, [customEmojis, debounced, enabled]);

  return { results, query: debounced };
}
