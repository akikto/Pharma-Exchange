import { describe, expect, it, vi } from 'vitest';
import { resolveBannerMediaUrl } from '@/lib/banner-media-url';

describe('resolveBannerMediaUrl', () => {
  it('rewrites dev placeholder URLs when bucket is configured', () => {
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'pharma-demo.appspot.com');
    expect(
      resolveBannerMediaUrl('https://storage.example.com/public/banners/a.webp'),
    ).toBe('https://storage.googleapis.com/pharma-demo.appspot.com/public/banners/a.webp');
    vi.unstubAllEnvs();
  });

  it('strips signed URL params for public banner objects', () => {
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'pharma-demo.appspot.com');
    expect(
      resolveBannerMediaUrl(
        'https://storage.googleapis.com/pharma-demo.appspot.com/public/banners/a.webp?X-Goog-Signature=abc',
      ),
    ).toBe('https://storage.googleapis.com/pharma-demo.appspot.com/public/banners/a.webp');
    vi.unstubAllEnvs();
  });
});
