import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const uploadOptimizedImage = vi.fn();
const cleanupImageIfUnreferenced = vi.fn();

vi.mock('../src/modules/upload/storage.service', () => ({
  storageService: {
    uploadOptimizedImage: (...args: unknown[]) => uploadOptimizedImage(...args),
    deleteFile: vi.fn(),
  },
}));

vi.mock('../src/modules/medicine/medicine.service', () => ({
  medicineService: {
    cleanupImageIfUnreferenced: (...args: unknown[]) => cleanupImageIfUnreferenced(...args),
  },
}));

const fixturePath = join(__dirname, 'fixtures', 'tiny.png');

describe('POST /api/v1/upload/medicine-image processing', () => {
  const app = createApp();
  const adminToken = signAccessToken({ userId: 'admin-user', role: UserRole.ADMIN });

  beforeEach(() => {
    vi.clearAllMocks();
    uploadOptimizedImage.mockResolvedValue({
      url: 'https://storage.example.com/public/medicines/test.webp',
      storageKey: 'public/medicines/test.webp',
      fileName: 'test.webp',
    });
  });

  it('optimizes upload to webp and stores via Firebase-compatible storage helper', async () => {
    const buffer = readFileSync(fixturePath);

    const res = await request(app)
      .post('/api/v1/upload/medicine-image')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('replaceUrl', 'https://storage.example.com/public/medicines/old.webp')
      .attach('file', buffer, { filename: 'medicine.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.url).toContain('medicines');
    expect(uploadOptimizedImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/webp',
      'public/medicines',
      'webp',
    );
    const uploadedBuffer = uploadOptimizedImage.mock.calls[0][0] as Buffer;
    expect(uploadedBuffer.byteLength).toBeGreaterThan(0);
    expect(cleanupImageIfUnreferenced).toHaveBeenCalledWith(
      'https://storage.example.com/public/medicines/old.webp',
    );
  });
});
