import { describe, expect, it, beforeAll } from 'vitest';
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

describe('POST /api/v1/medicines/catalog', () => {
  const app = createApp();
  let dbAvailable = false;
  let sellerToken = '';
  let buyerToken = '';

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    const seller = await prisma.user.findUnique({ where: { email: 'seller@pharmex.bd' } });
    const buyer = await prisma.user.findUnique({ where: { email: 'buyer@pharmex.bd' } });
    if (!seller || !buyer) return;

    sellerToken = signAccessToken({ userId: seller.id, role: seller.role });
    buyerToken = signAccessToken({ userId: buyer.id, role: buyer.role });
  });

  it('allows verified pharmacy sellers to create catalog medicines', async ({ skip }) => {
    if (!dbAvailable || !sellerToken) skip();

    const unique = Date.now();
    const res = await request(app)
      .post('/api/v1/medicines/catalog')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: `Seller Catalog Medicine ${unique}`,
        company: 'Test Pharma Ltd',
        dosageForm: 'TABLET',
        packSize: '10x10 Strip',
        category: 'Analgesic',
        strength: '500 mg',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.name).toBe(`Seller Catalog Medicine ${unique}`);
  });

  it('rejects buyers without verified pharmacy', async ({ skip }) => {
    if (!dbAvailable || !buyerToken) skip();

    const res = await request(app)
      .post('/api/v1/medicines/catalog')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        name: 'Blocked Medicine',
        company: 'Test Pharma Ltd',
        dosageForm: 'TABLET',
        packSize: '10x10 Strip',
        category: 'Analgesic',
      });

    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated requests', async ({ skip }) => {
    if (!dbAvailable) skip();

    const res = await request(app)
      .post('/api/v1/medicines/catalog')
      .send({
        name: 'Blocked Medicine',
        company: 'Test Pharma Ltd',
        dosageForm: 'TABLET',
        packSize: '10x10 Strip',
        category: 'Analgesic',
      });

    expect(res.status).toBe(401);
  });
});
