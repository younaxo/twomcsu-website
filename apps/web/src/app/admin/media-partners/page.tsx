'use client';

import { Clapperboard } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, extractErrorMessage } from '@/lib/api';

type Partner = {
  id: string;
  mediaGroup: string;
  channelUrl: string;
  rank: number;
  isApproved: boolean;
  user: { username: string };
  promoCode: { code: string; usedCount: number } | null;
};

export default function AdminMediaPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const load = useCallback(async () => {
    try {
      setPartners((await api.get<Partner[]>('/admin/media-partners')).data);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось загрузить партнёров'));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const rank = async (id: string, value: string) => {
    try {
      await api.patch(`/admin/media-partners/${id}/rank`, { rank: Number(value) });
      toast.success('Ранг обновлён');
      await load();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось обновить ранг'));
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Медиа-партнёры</h1>
        <p className="text-sm text-muted-foreground">Twitch, TikTok и YouTube · ранги 1–4</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {partners.map((partner) => (
          <Card key={partner.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15">
                  <Clapperboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{partner.user.username}</p>
                  <a
                    href={partner.channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary"
                  >
                    {partner.mediaGroup}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-muted-foreground">Промокод</p>
                  <p className="mt-1 font-medium">{partner.promoCode?.code ?? '—'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-muted-foreground">Регистрации</p>
                  <p className="mt-1 font-medium">{partner.promoCode?.usedCount ?? 0}</p>
                </div>
              </div>
              <Select
                value={String(partner.rank)}
                onValueChange={(value) => void rank(partner.id, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      Ранг {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
