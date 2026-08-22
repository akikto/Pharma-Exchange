const DEV_STORAGE_PREFIX = 'https://storage.example.com/';

export function isDevPlaceholderBannerMediaUrl(mediaUrl: string): boolean {
  try {
    return new URL(mediaUrl).hostname === 'storage.example.com';
  } catch {
    return false;
  }
}

export function isValidBannerMediaHttpUrl(mediaUrl: string): boolean {
  const trimmed = mediaUrl.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (isDevPlaceholderBannerMediaUrl(trimmed)) return false;
    return true;
  } catch {
    return false;
  }
}

export function extractBannerStorageKey(mediaUrl: string, bucket?: string): string | null {
  if (!mediaUrl) return null;
  if (mediaUrl.startsWith('public/banners/')) return mediaUrl;

  if (mediaUrl.startsWith(DEV_STORAGE_PREFIX)) {
    return mediaUrl.slice(DEV_STORAGE_PREFIX.length);
  }

  try {
    const url = new URL(mediaUrl);

    if (url.hostname === 'firebasestorage.googleapis.com') {
      const objectMatch = url.pathname.match(/\/o\/(.+)$/);
      if (objectMatch?.[1]) {
        return decodeURIComponent(objectMatch[1].split('?')[0] ?? objectMatch[1]);
      }
    }

    if (bucket && url.hostname === 'storage.googleapis.com') {
      const bucketPrefix = `/${bucket}/`;
      if (url.pathname.startsWith(bucketPrefix)) {
        return decodeURIComponent(url.pathname.slice(bucketPrefix.length));
      }
    }

    if (bucket) {
      const signedMarker = `/${bucket}/`;
      const idx = url.pathname.indexOf(signedMarker);
      if (idx >= 0) {
        return decodeURIComponent(url.pathname.slice(idx + signedMarker.length).split('?')[0] ?? '');
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function buildFirebaseMediaUrl(bucket: string, storageKey: string, downloadToken?: string): string {
  const base = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(storageKey)}?alt=media`;
  return downloadToken ? `${base}&token=${downloadToken}` : base;
}

export function buildGcsMediaUrl(bucket: string, storageKey: string): string {
  return `https://storage.googleapis.com/${bucket}/${storageKey}`;
}

/**
 * Normalizes banner media URLs for <img>/<video> src.
 */
export function resolveBannerMediaUrl(mediaUrl: string): string {
  if (!mediaUrl) return mediaUrl;

  try {
    const parsed = new URL(mediaUrl);
    if (parsed.hostname === 'firebasestorage.googleapis.com' && parsed.searchParams.has('token')) {
      return mediaUrl;
    }
  } catch {
    return mediaUrl;
  }

  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  const storageKey = bucket ? extractBannerStorageKey(mediaUrl, bucket) : null;

  if (bucket && storageKey?.startsWith('public/banners/')) {
    return buildFirebaseMediaUrl(bucket, storageKey);
  }

  return mediaUrl;
}

export function resolveBannerMediaFallbackUrl(mediaUrl: string, currentSrc: string): string | null {
  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  if (!bucket) return null;

  const storageKey = extractBannerStorageKey(mediaUrl, bucket);
  if (!storageKey?.startsWith('public/banners/')) return null;

  const gcs = buildGcsMediaUrl(bucket, storageKey);
  if (currentSrc.includes('firebasestorage.googleapis.com')) return gcs;

  return null;
}
