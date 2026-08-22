import { describe, expect, it, vi, beforeEach } from 'vitest';
import { storageService } from '../src/modules/upload/storage.service';

vi.mock('../src/config/firebase', () => ({
  getFirebaseStorage: () => null,
}));

describe('storageService public banner uploads', () => {
  beforeEach(() => {
    vi.stubEnv('FIREBASE_STORAGE_BUCKET', '');
  });

  it('uploadPublicBinary returns stable public URL under public/banners', async () => {
    const result = await storageService.uploadPublicBinary(
      Buffer.from('gif'),
      'image/gif',
      'public/banners',
      'gif',
      'promo.gif',
    );
    expect(result.url).toMatch(/^https:\/\/storage\.example\.com\/public\/banners\/.+\.gif$/);
    expect(result.storageKey).toMatch(/^public\/banners\/.+\.gif$/);
    expect(result.fileName).toBe('promo.gif');
  });
});
