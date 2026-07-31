'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  areNotificationSoundsEnabled,
  setNotificationSoundsEnabled,
} from '@/lib/notification-sounds';

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(areNotificationSoundsEnabled());
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-[#b0b0b0] hover:text-white"
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            setNotificationSoundsEnabled(next);
          }}
          aria-label={enabled ? 'Выключить звук уведомлений' : 'Включить звук уведомлений'}
        >
          {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{enabled ? 'Звук включён' : 'Звук выключен'}</TooltipContent>
    </Tooltip>
  );
}
