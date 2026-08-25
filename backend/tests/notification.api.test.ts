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

describe('Notifications API (BL-07)', () => {
  const app = createApp();
  let dbAvailable = false;
  let buyerToken = '';
  let buyerId = '';
  let adminToken = '';

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    const buyer = await prisma.user.findUnique({ where: { email: 'buyer@pharmex.bd' } });
    const admin = await prisma.user.findUnique({ where: { email: 'admin@pharmex.bd' } });
    if (!buyer || !admin) return;

    buyerId = buyer.id;
    buyerToken = signAccessToken({ userId: buyer.id, role: buyer.role });
    adminToken = signAccessToken({ userId: admin.id, role: admin.role });
  });

  it('registers and removes an FCM token', async ({ skip }) => {
    if (!dbAvailable || !buyerToken) skip();

    const token = `test-fcm-${Date.now()}`;

    const register = await request(app)
      .post('/api/v1/auth/fcm-token')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ token, deviceId: 'test-device', platform: 'web' });

    expect(register.status).toBe(201);

    const remove = await request(app)
      .delete('/api/v1/auth/fcm-token')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ token });

    expect(remove.status).toBe(200);
  });

  it('lists notifications and marks them read', async ({ skip }) => {
    if (!dbAvailable || !buyerToken) skip();

    const created = await prisma.notification.create({
      data: {
        userId: buyerId,
        type: 'SYSTEM',
        title: 'Test notification',
        body: 'Hello from BL-07 tests',
        data: { test: true },
      },
    });

    const list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(list.status).toBe(200);
    expect(list.body.data.some((n: { id: string }) => n.id === created.id)).toBe(true);

    const markRead = await request(app)
      .patch(`/api/v1/notifications/${created.id}/read`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(markRead.status).toBe(200);

    await prisma.notification.delete({ where: { id: created.id } });
  });

  it('deletes single, bulk, and all notifications for the user', async ({ skip }) => {
    if (!dbAvailable || !buyerToken) skip();

    const n1 = await prisma.notification.create({
      data: { userId: buyerId, type: 'SYSTEM', title: 'A', body: 'a' },
    });
    const n2 = await prisma.notification.create({
      data: { userId: buyerId, type: 'SYSTEM', title: 'B', body: 'b' },
    });

    const delOne = await request(app)
      .delete(`/api/v1/notifications/${n1.id}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(delOne.status).toBe(200);

    const delBulk = await request(app)
      .post('/api/v1/notifications/delete-bulk')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ ids: [n2.id] });
    expect(delBulk.status).toBe(200);
    expect(delBulk.body.deleted).toBe(1);

    const n3 = await prisma.notification.create({
      data: { userId: buyerId, type: 'SYSTEM', title: 'C', body: 'c' },
    });

    const delAll = await request(app)
      .post('/api/v1/notifications/delete-all')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(delAll.status).toBe(200);
    expect(delAll.body.deleted).toBeGreaterThanOrEqual(1);

    await prisma.notification.deleteMany({ where: { id: n3.id } }).catch(() => undefined);
  });

  it('allows admin broadcast and blocks non-admin', async ({ skip }) => {
    if (!dbAvailable || !buyerToken || !adminToken) skip();

    const forbidden = await request(app)
      .post('/api/v1/admin/notifications/broadcast')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ title: 'Blocked', body: 'Should not send' });

    expect(forbidden.status).toBe(403);

    const broadcast = await request(app)
      .post('/api/v1/admin/notifications/broadcast')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'BL-07 test', body: 'Admin broadcast test message' });

    expect(broadcast.status).toBe(200);
    expect(broadcast.body.sent).toBeGreaterThan(0);
  });
});
