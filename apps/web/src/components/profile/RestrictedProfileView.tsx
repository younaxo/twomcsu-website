'use client';

import type { RestrictedProfileResponse } from '@twomc/shared';
import { Lock } from 'lucide-react';
import Image from 'next/image';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { SkinHead } from '@/components/shared/SkinHead';
import { Card, CardContent } from '@/components/ui/card';
import { resolveMediaUrl } from '@/lib/profile';

interface RestrictedProfileViewProps {
  data: RestrictedProfileResponse;
}

export function RestrictedProfileView({ data }: RestrictedProfileViewProps) {
  const { user } = data;
  const bannerUrl = resolveMediaUrl(user.bannerUrl);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative h-40 w-full bg-secondary sm:h-52">
          {bannerUrl ? (
            <Image src={bannerUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-secondary via-accent to-secondary" />
          )}
        </div>

        <div className="relative px-4 pb-6 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
            <SkinHead
              username={user.username}
              avatar={resolveMediaUrl(user.avatar) ?? null}
              size={112}
              className="border-4 border-card shadow-lg"
            />
            <div className="space-y-2 pb-1">
              <ColoredUsername user={user} size="lg" linkToProfile={false} />
              <PositionBadge position={user.position} size="md" />
              {user.statusText ? (
                <p className="text-sm text-muted-foreground">{user.statusText}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="rounded-full bg-secondary p-3">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Приватный профиль</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Этот пользователь скрыл свой профиль от других
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
