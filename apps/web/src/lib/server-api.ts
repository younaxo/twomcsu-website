import type { RestrictedProfileResponse, UserProfile } from '@twomc/shared';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type PublicProfileResult =
  | { kind: 'ok'; profile: UserProfile }
  | { kind: 'restricted'; data: RestrictedProfileResponse }
  | { kind: 'not_found' };

/** Plain GET for server components */
export async function fetchPublic<T>(path: string): Promise<T | null> {
  const response = await fetch(`${baseUrl}${path}`, { cache: 'no-store' });

  if (response.status === 404 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GET ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchPublicProfile(username: string): Promise<PublicProfileResult> {
  const response = await fetch(`${baseUrl}/users/${encodeURIComponent(username)}/public`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return { kind: 'not_found' };
  }

  if (response.status === 403) {
    const body = (await response.json()) as RestrictedProfileResponse & {
      message?: RestrictedProfileResponse;
    };

    const data =
      body.restricted === true
        ? body
        : typeof body.message === 'object' && body.message?.restricted
          ? body.message
          : null;

    if (data) {
      return { kind: 'restricted', data };
    }

    return { kind: 'not_found' };
  }

  if (!response.ok) {
    throw new Error(`GET /users/${username}/public failed with ${response.status}`);
  }

  return { kind: 'ok', profile: (await response.json()) as UserProfile };
}
