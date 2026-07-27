import type { UserProfile } from '@twomc/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileClient } from '@/app/users/[username]/profile-client';
import { fetchPublic } from '@/lib/server-api';

interface PageProps {
  params: { username: string };
}

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
    description: profile.statusText ?? `${profile.username} на twomc.su`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const profile = await getProfile(params.username);

  if (!profile) {
    notFound();
  }

  return <ProfileClient username={params.username} initial={profile} />;
}
