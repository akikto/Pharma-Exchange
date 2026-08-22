import { describe, expect, it, vi } from 'vitest';
import {
  buildFirebaseMediaUrl,
  buildGcsMediaUrl,
  extractBannerStorageKey,
  resolveBannerMediaUrl,
} from '@/lib/banner-media-url';

describe('banner media URLs', () => {
  it('preserves Firebase URLs that include a download token', () => {
    const tokenized =
      'https://firebasestorage.googleapis.com/v0/b/pharma-demo.appspot.com/o/public%2Fbanners%2Fa.webp?alt=media&token=abc';
    expect(resolveBannerMediaUrl(tokenized)).toBe(tokenized);
  });

  it('rewrites dev placeholder URLs when bucket is configured', () => {
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'pharma-demo.appspot.com');
    expect(
      resolveBannerMediaUrl('https://storage.example.com/public/banners/a.webp'),
    ).toBe(buildFirebaseMediaUrl('pharma-demo.appspot.com', 'public/banners/a.webp'));
    vi.unstubAllEnvs();
  });

  it('extracts storage key from legacy GCS signed URLs', () => {
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'pharma-demo.appspot.com');
    const key = extractBannerStorageKey(
      'https://storage.googleapis.com/pharma-demo.appspot.com/public/banners/a.webp?X-Goog-Signature=abc',
      'pharma-demo.appspot.com',
    );
    expect(key).toBe('public/banners/a.webp');
    expect(resolveBannerMediaUrl(
      'https://storage.googleapis.com/pharma-demo.appspot.com/public/banners/a.webp?X-Goog-Signature=abc',
    )).toBe(buildFirebaseMediaUrl('pharma-demo.appspot.com', 'public/banners/a.webp'));
    vi.unstubAllEnvs();
  });

  it('builds GCS URL helper', () => {
    expect(buildGcsMediaUrl('b', 'public/banners/x.webp')).toBe(
      'https://storage.googleapis.com/b/public/banners/x.webp',
    );
  });
});
