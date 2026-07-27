const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Plain GET for server components, returns null on 404 */
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
