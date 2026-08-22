const DEV_STORAGE_PREFIX = 'https://storage.example.com/';

/**
 * Normalizes banner media URLs for <img>/<video> src.
 * - Maps dev placeholder hosts to the configured Firebase bucket.
 * - Strips signed-URL query params for objects already under public/banners/.
 */
export function resolveBannerMediaUrl(mediaUrl: string): string {
  if (!mediaUrl) return mediaUrl;

  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  if (bucket && mediaUrl.startsWith(DEV_STORAGE_PREFIX)) {
    const storageKey = mediaUrl.slice(DEV_STORAGE_PREFIX.length);
    return `https://storage.googleapis.com/${bucket}/${storageKey}`;
  }

  if (bucket && mediaUrl.startsWith('public/')) {
    return `https://storage.googleapis.com/${bucket}/${mediaUrl}`;
  }

  if (!bucket) return mediaUrl;

  try {
    const url = new URL(mediaUrl);
    if (url.hostname !== 'storage.googleapis.com') return mediaUrl;

    const bucketPrefix = `/${bucket}/`;
    if (!url.pathname.startsWith(bucketPrefix)) return mediaUrl;

    const storageKey = decodeURIComponent(url.pathname.slice(bucketPrefix.length));
    if (!storageKey.startsWith('public/banners/')) return mediaUrl;

    return `https://storage.googleapis.com/${bucket}/${storageKey}`;
  } catch {
    return mediaUrl;
  }
}
