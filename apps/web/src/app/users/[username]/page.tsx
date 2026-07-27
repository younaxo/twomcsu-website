import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileClient } from '@/app/users/[username]/profile-client';
import { RestrictedProfileView } from '@/components/profile/RestrictedProfileView';
import { fetchPublicProfile } from '@/lib/server-api';

interface PageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await fetchPublicProfile(params.username);

  if (result.kind === 'not_found') {
    return { title: 'Игрок не найден — twomc.su' };
  }

  if (result.kind === 'restricted') {
    return {
      title: `${result.data.user.username} — twomc.su`,
      description: 'Приватный профиль',
    };
  }

  return {
    title: `${result.profile.username} — twomc.su`,
    description: result.profile.statusText ?? `${result.profile.username} на twomc.su`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const result = await fetchPublicProfile(params.username);

  if (result.kind === 'not_found') {
    notFound();
  }

  if (result.kind === 'restricted') {
    return <RestrictedProfileView data={result.data} />;
  }

  return <ProfileClient username={params.username} initial={result.profile} />;
}
