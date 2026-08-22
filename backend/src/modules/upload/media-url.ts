import { getFirebaseStorageBucket } from '../../config/env';

const DEV_STORAGE_HOST = 'storage.example.com';

export function isDevPlaceholderMediaUrl(url: string): boolean {
  try {
    return new URL(url).hostname === DEV_STORAGE_HOST;
  } catch {
    return false;
  }
}

export function assertValidPersistableMediaUrl(url: string): void {
  const trimmed = url?.trim();
  if (!trimmed) {
    throw new Error('Media URL is required');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Media URL must be a valid HTTP or HTTPS URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Media URL must use HTTP or HTTPS');
  }

  if (isDevPlaceholderMediaUrl(trimmed)) {
    throw new Error('Media URL is not a valid production storage URL');
  }
}

export async function assertMediaUrlReadable(url: string): Promise<void> {
  if (isDevPlaceholderMediaUrl(url)) {
    return;
  }

  const attempt = async (method: 'HEAD' | 'GET') => {
    const init: RequestInit =
      method === 'GET'
        ? { method, redirect: 'follow', headers: { Range: 'bytes=0-1023' } }
        : { method, redirect: 'follow' };
    return fetch(url, init);
  };

  let response = await attempt('HEAD');
  if (response.status === 405 || response.status === 501) {
    response = await attempt('GET');
  }
  if (!response.ok) {
    throw new Error(`Uploaded media is not publicly readable (HTTP ${response.status})`);
  }
}

export function buildFirebaseDownloadUrl(storageKey: string, downloadToken: string): string {
  const bucket = getFirebaseStorageBucket();
  if (!bucket) {
    return `https://${DEV_STORAGE_HOST}/${storageKey}`;
  }
  const encoded = encodeURIComponent(storageKey);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media&token=${downloadToken}`;
}
