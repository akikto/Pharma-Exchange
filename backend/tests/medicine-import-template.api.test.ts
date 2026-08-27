import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';
import { readMedicineImportTemplateBuffer } from '../src/modules/medicine/medicine-import-template';

const dbAvailable = Boolean(process.env.DATABASE_URL);

describe('Admin medicine import template API', () => {
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

  it('serves prebuilt xlsx for admin', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const res = await request(app)
      .get('/api/v1/admin/medicines/import/template')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheetml/);
    expect(res.body.length).toBeGreaterThan(1000);
    expect(res.body.slice(0, 2).toString('utf8')).toBe('PK');
  });

  it('rejects non-admin', async ({ skip }) => {
    if (!dbAvailable || !buyerToken) skip();
    const res = await request(app)
      .get('/api/v1/admin/medicines/import/template')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(403);
  });

  it('static template asset is readable', () => {
    const buffer = readMedicineImportTemplateBuffer();
    expect(buffer.subarray(0, 2).toString('utf8')).toBe('PK');
  });
});
