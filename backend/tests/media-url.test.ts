import { describe, expect, it, vi } from 'vitest';
import {
  assertValidPersistableMediaUrl,
  buildFirebaseDownloadUrl,
  isDevPlaceholderMediaUrl,
} from '../src/modules/upload/media-url';

describe('media-url helpers', () => {
  it('detects dev placeholder URLs', () => {
    expect(isDevPlaceholderMediaUrl('https://storage.example.com/public/banners/a.webp')).toBe(true);
    expect(isDevPlaceholderMediaUrl('https://firebasestorage.googleapis.com/v0/b/x/o/a?alt=media')).toBe(false);
  });

  it('builds Firebase download URLs with token', () => {
    vi.stubEnv('FIREBASE_STORAGE_BUCKET', 'demo.appspot.com');
    expect(buildFirebaseDownloadUrl('public/banners/a.webp', 'tok-1')).toBe(
      'https://firebasestorage.googleapis.com/v0/b/demo.appspot.com/o/public%2Fbanners%2Fa.webp?alt=media&token=tok-1',
    );
    vi.unstubAllEnvs();
  });

  it('rejects placeholder and invalid URLs for persistence', () => {
    expect(() => assertValidPersistableMediaUrl('')).toThrow();
    expect(() => assertValidPersistableMediaUrl('not-a-url')).toThrow();
    expect(() => assertValidPersistableMediaUrl('https://storage.example.com/x')).toThrow();
    expect(() =>
      assertValidPersistableMediaUrl(
        'https://firebasestorage.googleapis.com/v0/b/demo/o/public%2Fbanners%2Fa.webp?alt=media&token=abc',
      ),
    ).not.toThrow();
  });
});
