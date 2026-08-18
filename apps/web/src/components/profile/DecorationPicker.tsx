'use client';

import type { MyProfile } from '@twomc/shared';
import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AvatarWithSkin } from '@/components/shared/AvatarWithSkin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOwnedDecorations, useSelectDecoration } from '@/hooks/useDecorations';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

export function DecorationPicker({
  profile,
  onChange,
}: {
  profile: MyProfile;
  onChange: (decoration: MyProfile['avatarDecoration']) => void;
}) {
  const owned = useOwnedDecorations();
  const select = useSelectDecoration();
  const fetchMe = useAuthStore((state) => state.fetchMe);

  const choose = async (id: string | null) => {
    try {
      await select.mutateAsync(id);
      const decoration = owned.data?.find((item) => item.id === id) ?? null;
      onChange(decoration);
      await fetchMe();
      toast.success(decoration ? 'Украшение установлено' : 'Украшение снято');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Не удалось выбрать украшение'));
    }
  };

  return (
    <Card className="glass-medium border-white/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Украшение аватара</CardTitle>
        <CardDescription>Выберите рамку или эффект из своей коллекции</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-5 rounded-xl border border-white/10 bg-black/20 p-4">
          <AvatarWithSkin user={profile} size="xl" />
          <div>
            <p className="font-medium">{profile.avatarDecoration?.name ?? 'Без украшения'}</p>
            <p className="text-sm text-muted-foreground">Предпросмотр выбранного оформления</p>
          </div>
        </div>
        {owned.isLoading ? <p className="text-sm text-muted-foreground">Загрузка коллекции…</p> : null}
        {!owned.isLoading && !owned.data?.length ? (
          <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-muted-foreground">
            В коллекции пока нет украшений. Доступные варианты появятся в магазине.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {owned.data?.map((item) => {
              const active = profile.avatarDecoration?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void choose(active ? null : item.id)}
                  disabled={select.isPending}
                  className={cn(
                    'relative rounded-xl border bg-black/20 p-3 text-left transition-colors hover:border-white/25',
                    active ? 'border-primary bg-primary/10' : 'border-white/10',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.name} className="mx-auto aspect-square w-full object-contain" />
                  <span className="mt-2 block text-xs font-medium">{item.name}</span>
                  {active ? <Check className="absolute right-2 top-2 h-5 w-5 rounded-full bg-primary p-1 text-white" /> : null}
                </button>
              );
            })}
          </div>
        )}
        {profile.avatarDecoration ? (
          <Button variant="secondary" onClick={() => void choose(null)} disabled={select.isPending}>Снять украшение</Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
