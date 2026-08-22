import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { BannerActionType, BannerMediaType } from '@prisma/client';
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

describe('Home banners API', () => {
  const app = createApp();
  let dbAvailable = false;
  let adminToken = '';
  let buyerToken = '';
  let createdId = '';

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    const admin = await prisma.user.findUnique({ where: { email: 'admin@pharmex.bd' } });
    const buyer = await prisma.user.findUnique({ where: { email: 'buyer@pharmex.bd' } });
    if (!admin || !buyer) return;

    adminToken = signAccessToken({ userId: admin.id, role: admin.role });
    buyerToken = signAccessToken({ userId: buyer.id, role: buyer.role });
  });

  afterAll(async () => {
    if (createdId) {
      await prisma.homeBanner.deleteMany({ where: { id: createdId } });
    }
  });

  it('rejects non-admin banner create', async ({ skip }) => {
    if (!dbAvailable || !buyerToken) skip();

    const res = await request(app)
      .post('/api/v1/admin/banners')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Test',
        mediaUrl: 'https://example.com/banner.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.NONE,
      });

    expect(res.status).toBe(403);
  });

  it('admin creates, lists, and public API returns active ordered banners', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();

    const create = await request(app)
      .post('/api/v1/admin/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Promo A',
        mediaUrl: 'https://example.com/a.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.INTERNAL_PATH,
        actionTarget: '/search',
        isActive: true,
        sortOrder: 0,
      });

    expect(create.status).toBe(201);
    createdId = create.body.id;

    const inactive = await request(app)
      .post('/api/v1/admin/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Hidden',
        mediaUrl: 'https://example.com/hidden.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.NONE,
        isActive: false,
        sortOrder: 1,
      });

    expect(inactive.status).toBe(201);
    const inactiveId = inactive.body.id as string;

    const publicList = await request(app).get('/api/v1/banners');
    expect(publicList.status).toBe(200);
    expect(publicList.body.data.some((b: { id: string }) => b.id === createdId)).toBe(true);
    expect(publicList.body.data.some((b: { id: string }) => b.id === inactiveId)).toBe(false);
    expect(publicList.body.data[0].isActive).toBeUndefined();

    await request(app)
      .patch(`/api/v1/admin/banners/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    const publicAfter = await request(app).get('/api/v1/banners');
    expect(publicAfter.body.data.some((b: { id: string }) => b.id === createdId)).toBe(false);

    await prisma.homeBanner.deleteMany({ where: { id: inactiveId } });
  });

  it('rejects invalid external URL action configuration', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();

    const res = await request(app)
      .post('/api/v1/admin/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Bad URL',
        mediaUrl: 'https://example.com/b.jpg',
        mediaType: BannerMediaType.IMAGE,
        actionType: BannerActionType.EXTERNAL_URL,
        actionTarget: 'not-a-url',
      });

    expect(res.status).toBe(400);
  });
});
