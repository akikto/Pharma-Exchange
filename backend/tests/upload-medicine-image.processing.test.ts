import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';

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
  let adminToken = '';

  beforeAll(async () => {
    try {
      const admin = await prisma.user.findUnique({ where: { email: 'admin@pharmex.bd' } });
      if (admin) {
        adminToken = signAccessToken({ userId: admin.id, role: admin.role });
      }
    } catch {
      adminToken = '';
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    uploadOptimizedImage.mockResolvedValue({
      url: 'https://storage.example.com/public/medicines/test.webp',
      storageKey: 'public/medicines/test.webp',
      fileName: 'test.webp',
    });
  });

  it('optimizes upload to webp and stores via Firebase-compatible storage helper', async ({ skip }) => {
    if (!adminToken) skip();
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
