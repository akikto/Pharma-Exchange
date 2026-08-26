import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';
import { medicineIdentityKey } from '../src/modules/medicine/medicine-import.service';

async function isDatabaseAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe('medicineIdentityKey', () => {
  it('normalizes case and whitespace for stable matching', () => {
    const a = medicineIdentityKey({
      name: ' Napa ',
      company: 'Beximco',
      dosageForm: 'tablet',
      strength: '500mg',
      packSize: '10 tablets',
    });
    const b = medicineIdentityKey({
      name: 'napa',
      company: 'beximco',
      dosageForm: 'TABLET',
      strength: '500mg',
      packSize: '10 tablets',
    });
    expect(a).toBe(b);
  });
});

describe('Admin medicine import/export API', () => {
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

  it('rejects unauthenticated template download', async ({ skip }) => {
    if (!dbAvailable) skip();
    const res = await request(app).get('/api/v1/admin/medicines/import/template');
    expect(res.status).toBe(401);
  });

  it('rejects non-admin export', async ({ skip }) => {
    if (!dbAvailable || !sellerToken) skip();
    const res = await request(app)
      .get('/api/v1/admin/medicines/export?format=csv')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns template xlsx for admin', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const res = await request(app)
      .get('/api/v1/admin/medicines/import/template')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheet/);
  });

  it('exports medicine catalog as csv for admin', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const res = await request(app)
      .get('/api/v1/admin/medicines/export?format=csv')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/csv/);
  });
});
