import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import { XLSX } from '../src/modules/medicine/medicine-import.xlsx';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';
import { medicineIdentityKey } from '../src/modules/medicine/medicine-import.service';
import { TEMPLATE_EXAMPLE_ROW } from '../src/modules/medicine/medicine-import.constants';

async function isDatabaseAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

function buildXlsxBuffer(rows: Record<string, string>[]): Buffer {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Medicines');
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
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

  it('rejects non-admin import preview', async ({ skip }) => {
    if (!dbAvailable || !sellerToken) skip();
    const buffer = buildXlsxBuffer([TEMPLATE_EXAMPLE_ROW]);
    const res = await request(app)
      .post('/api/v1/admin/medicines/import/preview')
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('file', buffer, 'medicines.xlsx');
    expect(res.status).toBe(403);
  });

  it('returns template xlsx for admin', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const res = await request(app)
      .get('/api/v1/admin/medicines/import/template')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheet/);
    expect(res.body.length).toBeGreaterThan(100);
  });

  it('previews valid xlsx import', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const unique = `ImportTest-${Date.now()}`;
    const row = {
      ...TEMPLATE_EXAMPLE_ROW,
      name: unique,
      brandName: unique,
    };
    const buffer = buildXlsxBuffer([row]);
    const res = await request(app)
      .post('/api/v1/admin/medicines/import/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('mode', 'upsert')
      .attach('file', buffer, 'medicines.xlsx');
    expect(res.status).toBe(200);
    expect(res.body.totalRows).toBe(1);
    expect(res.body.validRows).toBe(1);
    expect(res.body.newMedicines).toBeGreaterThanOrEqual(1);
  });

  it('rejects invalid headers', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const buffer = buildXlsxBuffer([{ wrongColumn: 'x' }]);
    const res = await request(app)
      .post('/api/v1/admin/medicines/import/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', buffer, 'bad.xlsx');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required columns/i);
  });

  it('imports and exports csv', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const unique = `CsvImport-${Date.now()}`;
    const row = {
      ...TEMPLATE_EXAMPLE_ROW,
      name: unique,
      brandName: unique,
      company: `Company ${unique}`,
    };
    const buffer = buildXlsxBuffer([row]);

    const importRes = await request(app)
      .post('/api/v1/admin/medicines/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('mode', 'createOnly')
      .attach('file', buffer, 'medicines.xlsx');
    expect(importRes.status).toBe(200);
    expect(importRes.body.created).toBeGreaterThanOrEqual(1);

    const exportRes = await request(app)
      .get(`/api/v1/admin/medicines/export?format=csv&q=${encodeURIComponent(unique)}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.text).toContain(unique);

    await prisma.medicine.deleteMany({ where: { name: unique } });
  });

  it('createOnly skips duplicate medicines', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const existing = await prisma.medicine.findFirst({ where: { isActive: true } });
    if (!existing) skip();

    const row = {
      name: existing.name,
      genericName: existing.genericName ?? '',
      brandName: existing.brandName ?? '',
      company: existing.company,
      dosageForm: existing.dosageForm,
      strength: existing.strength ?? '',
      packSize: existing.packSize,
      category: existing.category,
      scheduleClass: existing.scheduleClass ?? '',
      composition: existing.composition ?? '',
      imageUrl: existing.imageUrl ?? '',
    };
    const buffer = buildXlsxBuffer([row]);
    const res = await request(app)
      .post('/api/v1/admin/medicines/import/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('mode', 'createOnly')
      .attach('file', buffer, 'dup.xlsx');
    expect(res.status).toBe(200);
    expect(res.body.validRows).toBe(0);
    expect(res.body.errors[0]?.message).toMatch(/already exists|Duplicate/i);
  });
});
