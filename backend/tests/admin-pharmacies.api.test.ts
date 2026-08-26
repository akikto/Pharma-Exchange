import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { VerificationStatus } from '@prisma/client';
import prisma from '../src/config/database';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';

const dbAvailable = Boolean(process.env.DATABASE_URL);

describe('Admin pharmacies API', () => {
  const app = createApp();
  let adminToken = '';
  let buyerToken = '';
  let disposablePharmacyId = '';
  let disposableUserId = '';

  beforeAll(async () => {
    if (!dbAvailable) return;
    const admin = await prisma.user.findUnique({ where: { email: 'admin@pharmex.bd' } });
    const buyer = await prisma.user.findUnique({ where: { email: 'buyer@pharmex.bd' } });
    if (!admin || !buyer) return;
    adminToken = signAccessToken({ userId: admin.id, role: admin.role });
    buyerToken = signAccessToken({ userId: buyer.id, role: buyer.role });

    const user = await prisma.user.create({
      data: {
        email: `admin-delete-test-${Date.now()}@pharmex.bd`,
        passwordHash: 'unused',
        firstName: 'Delete',
        lastName: 'Test',
        role: 'USER',
      },
    });
    disposableUserId = user.id;
    const pharmacy = await prisma.pharmacy.create({
      data: {
        userId: user.id,
        name: 'Disposable Test Pharmacy',
        licenseNumber: `DEL-${Date.now()}`,
        address: '1 Test Rd',
        city: 'Dhaka',
        district: 'Dhaka',
        verificationStatus: VerificationStatus.PENDING,
      },
    });
    disposablePharmacyId = pharmacy.id;
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    if (disposablePharmacyId) {
      await prisma.pharmacy.deleteMany({ where: { id: disposablePharmacyId } }).catch(() => undefined);
    }
    if (disposableUserId) {
      await prisma.user.deleteMany({ where: { id: disposableUserId } }).catch(() => undefined);
    }
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
    expect(typeof res.body.canPermanentlyDelete).toBe('boolean');
  });

  it('patches pharmacy profile fields as admin', async ({ skip }) => {
    if (!dbAvailable || !adminToken || !disposablePharmacyId) skip();
    const res = await request(app)
      .patch(`/api/v1/admin/pharmacies/${disposablePharmacyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ city: 'Chattogram' });
    expect(res.status).toBe(200);
    expect(res.body.city).toBe('Chattogram');
    expect(res.body.owner).toBeTruthy();
  });

  it('updates owner phone as admin', async ({ skip }) => {
    if (!dbAvailable || !adminToken || !disposablePharmacyId) skip();
    const phone = `017${String(Date.now()).slice(-8)}`;
    const res = await request(app)
      .patch(`/api/v1/admin/pharmacies/${disposablePharmacyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ownerPhone: phone });
    expect(res.status).toBe(200);
    expect(res.body.owner?.phone).toBe(phone);
  });

  it('rejects non-admin pharmacy delete', async ({ skip }) => {
    if (!dbAvailable || !buyerToken || !disposablePharmacyId) skip();
    const res = await request(app)
      .delete(`/api/v1/admin/pharmacies/${disposablePharmacyId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ confirmName: 'Disposable Test Pharmacy' });
    expect(res.status).toBe(403);
  });

  it('rejects delete with wrong confirmation name', async ({ skip }) => {
    if (!dbAvailable || !adminToken || !disposablePharmacyId) skip();
    const res = await request(app)
      .delete(`/api/v1/admin/pharmacies/${disposablePharmacyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirmName: 'Wrong Name' });
    expect(res.status).toBe(400);
  });

  it('permanently deletes pharmacy without transactional history', async ({ skip }) => {
    if (!dbAvailable || !adminToken || !disposablePharmacyId) skip();
    const res = await request(app)
      .delete(`/api/v1/admin/pharmacies/${disposablePharmacyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirmName: 'Disposable Test Pharmacy' });
    expect(res.status).toBe(204);
    const deletedId = disposablePharmacyId;
    disposablePharmacyId = '';
    const gone = await prisma.pharmacy.findUnique({ where: { id: deletedId } });
    expect(gone).toBeNull();
  });

  it('blocks permanent delete when seller has orders', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const withOrders = await prisma.pharmacy.findFirst({
      where: { ordersAsSeller: { some: {} } },
      select: { id: true, name: true },
    });
    if (!withOrders) skip();
    const res = await request(app)
      .delete(`/api/v1/admin/pharmacies/${withOrders.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirmName: withOrders.name });
    expect(res.status).toBe(409);
  });
});
