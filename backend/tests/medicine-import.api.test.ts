import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';
import { medicineIdentityKey } from '../src/modules/medicine/medicine-import.service';
import { MEDICINE_IMPORT_COLUMNS, TEMPLATE_EXAMPLE_ROW } from '../src/modules/medicine/medicine-import.constants';

async function isDatabaseAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function buildCsvBuffer(rows: Record<string, string>[], headers: string[] = [...MEDICINE_IMPORT_COLUMNS]): Buffer {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h] ?? '')).join(',')),
  ];
  return Buffer.from(lines.join('\n'), 'utf-8');
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
    const buffer = buildCsvBuffer([TEMPLATE_EXAMPLE_ROW]);
    const res = await request(app)
      .post('/api/v1/admin/medicines/import/preview')
      .set('Authorization', `Bearer ${sellerToken}`)
      .attach('file', buffer, 'medicines.csv');
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
      company: `Company ${unique}`,
      packSize: `Pack ${unique}`,
    };
    const buffer = buildCsvBuffer([row]);
    const res = await request(app)
      .post('/api/v1/admin/medicines/import/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('mode', 'upsert')
      .attach('file', buffer, 'medicines.csv');
    expect(res.status).toBe(200);
    expect(res.body.totalRows).toBe(1);
    expect(res.body.validRows).toBe(1);
    expect(res.body.newMedicines).toBeGreaterThanOrEqual(1);
  });

  it('rejects invalid headers', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const buffer = buildCsvBuffer([{ wrongColumn: 'x' }], ['wrongColumn']);
    const res = await request(app)
      .post('/api/v1/admin/medicines/import/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', buffer, 'bad.csv');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required columns/i);
  });

  it('createOnly rejects duplicate medicines', async ({ skip }) => {
    if (!dbAvailable || !adminToken) skip();
    const unique = `DupTest-${Date.now()}`;
    const created = await prisma.medicine.create({
      data: {
        name: unique,
        company: `Co ${unique}`,
        dosageForm: 'TABLET',
        packSize: '10 tabs',
        category: 'Test',
      },
    });

    const row = {
      name: created.name,
      genericName: created.genericName ?? '',
      brandName: created.brandName ?? '',
      company: created.company,
      dosageForm: created.dosageForm,
      strength: created.strength ?? '',
      packSize: created.packSize,
      category: created.category,
      scheduleClass: created.scheduleClass ?? '',
      composition: created.composition ?? '',
      imageUrl: created.imageUrl ?? '',
    };
    const buffer = buildCsvBuffer([row]);
    const res = await request(app)
      .post('/api/v1/admin/medicines/import/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('mode', 'createOnly')
      .attach('file', buffer, 'dup.csv');
    expect(res.status).toBe(200);
    expect(res.body.validRows).toBe(0);
    expect(res.body.errors.some((e: { message: string }) => /Duplicate/i.test(e.message))).toBe(true);

    await prisma.medicine.delete({ where: { id: created.id } });
  });
});
