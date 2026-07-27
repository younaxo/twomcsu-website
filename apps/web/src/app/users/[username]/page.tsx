import type { UserProfile } from '@twomc/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ColoredUsername } from '@/components/shared/ColoredUsername';
import { PositionBadge } from '@/components/shared/PositionBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { fetchPublic } from '@/lib/server-api';

interface PageProps {
  params: { username: string };
}

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' });

async function getProfile(username: string): Promise<UserProfile | null> {
  return fetchPublic<UserProfile>(`/users/${encodeURIComponent(username)}/public`);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getProfile(params.username);

  if (!profile) {
    return { title: 'Игрок не найден — twomc.su' };
  }

  return {
    title: `${profile.username} — twomc.su`,
    description: `${profile.username}, ${profile.position.displayName} на twomc.su`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const profile = await getProfile(params.username);

  if (!profile) {
    notFound();
  }

  const skinUrl = profile.minecraftNick
    ? `https://minotar.net/helm/${profile.minecraftNick}/128.png`
    : (profile.avatar ?? undefined);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-start">
        <Avatar className="h-24 w-24 rounded-xl">
          <AvatarImage src={skinUrl} alt={profile.username} />
          <AvatarFallback className="rounded-xl text-2xl">
            {profile.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-center gap-3 sm:items-start">
          <ColoredUsername user={profile} size="lg" linkToProfile={false} />
          <PositionBadge position={profile.position} size="lg" />

          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">На сервере с</dt>
            <dd>{dateFormat.format(new Date(profile.createdAt))}</dd>

            {profile.minecraftNick ? (
              <>
                <dt className="text-muted-foreground">Minecraft</dt>
                <dd>{profile.minecraftNick}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
