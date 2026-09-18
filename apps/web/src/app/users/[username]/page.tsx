import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileClient } from '@/app/users/[username]/profile-client';
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

  // Restricted SSR responses still mount the client so an authenticated owner can load their profile
  if (result.kind === 'restricted') {
    return (
      <ProfileClient username={params.username} initial={null} initialRestricted={result.data} />
    );
  }

  return <ProfileClient username={params.username} initial={result.profile} />;
}
