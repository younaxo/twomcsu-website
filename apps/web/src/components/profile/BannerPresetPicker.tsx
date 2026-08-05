'use client';

import type { BannerPreset } from '@twomc/shared';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BannerPresetPickerProps {
  value: string | null;
  onSelect: (presetId: string, imageUrl: string) => void;
}

export function BannerPresetPicker({ value, onSelect }: BannerPresetPickerProps) {
  const [presets, setPresets] = useState<BannerPreset[]>([]);
  const [isBusy, setBusy] = useState(false);

  useEffect(() => {
    void api
      .get<BannerPreset[]>('/banners/presets')
      .then(({ data }) => setPresets(data))
      .catch((error) => toast.error(extractErrorMessage(error, 'Не удалось загрузить пресеты')));
  }, []);

  const pick = async (preset: BannerPreset) => {
    setBusy(true);
    try {
      await api.patch('/users/me/banner/preset', { presetId: preset.id });
      onSelect(preset.id, preset.imageUrl);
      toast.success('Пресет баннера выбран');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выбрать пресет'));
    } finally {
      setBusy(false);
    }
  };

  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          disabled={isBusy}
          onClick={() => void pick(preset)}
          className={cn(
            'relative aspect-[4/1] overflow-hidden rounded-md border border-border transition-opacity hover:opacity-90',
            value === preset.id && 'ring-2 ring-primary',
          )}
          title={preset.name}
        >
          <Image src={preset.imageUrl} alt={preset.name} fill className="object-cover" unoptimized />
        </button>
      ))}
    </div>
  );
}
