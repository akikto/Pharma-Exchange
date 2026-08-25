import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import prisma from '../src/config/database';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';

const dbAvailable = Boolean(process.env.DATABASE_URL);

describe('Admin pharmacies API', () => {
  const app = createApp();
  let adminToken = '';
  let buyerToken = '';

  beforeAll(async () => {
    if (!dbAvailable) return;
    const admin = await prisma.user.findUnique({ where: { email: 'admin@pharmex.bd' } });
    const buyer = await prisma.user.findUnique({ where: { email: 'buyer@pharmex.bd' } });
    if (!admin || !buyer) return;
    adminToken = signAccessToken({ userId: admin.id, role: admin.role });
    buyerToken = signAccessToken({ userId: buyer.id, role: buyer.role });
  });

  it('rejects non-admin pharmacy list', async ({ skip }) => {
    if (!dbAvailable || !buyerToken) skip();
    const res = await request(app)
      .get('/api/v1/admin/pharmacies')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(403);
  });

  it('lists pharmacies for admin', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const res = await request(app)
      .get('/api/v1/admin/pharmacies?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeTruthy();
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('listingCount');
      expect(res.body.data[0]).toHaveProperty('verificationStatus');
    }
  });

  it('gets pharmacy detail for admin', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const list = await request(app)
      .get('/api/v1/admin/pharmacies?limit=1')
      .set('Authorization', `Bearer ${adminToken}`);
    if (list.body.data.length === 0) skip();
    const id = list.body.data[0].id;
    const res = await request(app)
      .get(`/api/v1/admin/pharmacies/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(typeof res.body.activeListingCount).toBe('number');
  });
});
