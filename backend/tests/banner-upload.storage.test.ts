import { describe, expect, it, vi, beforeEach } from 'vitest';
import { storageService } from '../src/modules/upload/storage.service';

const saveMock = vi.fn();
const deleteMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../src/modules/upload/media-url', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/modules/upload/media-url')>();
  return {
    ...actual,
    assertMediaUrlReadable: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../src/config/firebase', () => ({
  getFirebaseStorage: () => ({
    bucket: () => ({
      file: (key: string) => ({
        save: saveMock,
        delete: deleteMock,
      }),
    }),
  }),
}));

describe('storageService public banner uploads', () => {
  beforeEach(() => {
    vi.stubEnv('FIREBASE_STORAGE_BUCKET', 'demo.appspot.com');
    vi.stubEnv('NODE_ENV', 'test');
    saveMock.mockReset();
    saveMock.mockResolvedValue(undefined);
  });

  it('uploadPublicBinary returns tokenized Firebase URL under public/banners', async () => {
    const result = await storageService.uploadPublicBinary(
      Buffer.from('gif'),
      'image/gif',
      'public/banners',
      'gif',
      'promo.gif',
    );
    expect(result.url).toMatch(
      /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/demo\.appspot\.com\/o\/public%2Fbanners%2F.+\.gif\?alt=media&token=/,
    );
    expect(result.storageKey).toMatch(/^public\/banners\/.+\.gif$/);
    expect(result.fileName).toBe('promo.gif');
    expect(saveMock).toHaveBeenCalled();
    const saveArgs = saveMock.mock.calls[0]?.[1];
    expect(saveArgs?.metadata?.metadata?.firebaseStorageDownloadTokens).toBeTruthy();
  });
});
