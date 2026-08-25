import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';

async function isDatabaseAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe('POST /api/v1/upload/medicine-image', () => {
  const app = createApp();
  let dbAvailable = false;
  let adminToken = '';
  let sellerToken = '';

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    const admin = await prisma.user.findUnique({ where: { email: 'admin@pharmex.bd' } });
    const seller = await prisma.user.findUnique({ where: { email: 'seller@pharmex.bd' } });
    if (!admin || !seller) return;

    adminToken = signAccessToken({ userId: admin.id, role: admin.role });
    sellerToken = signAccessToken({ userId: seller.id, role: seller.role });
  });

  it('rejects verified pharmacy sellers', async ({ skip }) => {
    if (!dbAvailable || !sellerToken) skip();

    const res = await request(app)
      .post('/api/v1/upload/medicine-image')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(403);
  });

  it('allows admin past auth middleware', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();

    const res = await request(app)
      .post('/api/v1/upload/medicine-image')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).not.toBe(403);
    expect([400, 201, 500]).toContain(res.status);
  });

  it('rejects unauthenticated requests', async ({ skip }) => {
    if (!dbAvailable) skip();

    const res = await request(app).post('/api/v1/upload/medicine-image');
    expect(res.status).toBe(401);
  });
});
