import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';
import { readMedicineImportTemplateBuffer } from '../src/modules/medicine/medicine-import-template';

describe('Admin medicine import template API', () => {
  const app = createApp();
  const adminToken = signAccessToken({ userId: 'admin-template-test', role: 'ADMIN' });
  const buyerToken = signAccessToken({ userId: 'buyer-template-test', role: 'USER' });

  it('serves prebuilt xlsx for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/medicines/import/template')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheetml/);
    expect(res.body.length).toBeGreaterThan(1000);
    expect(res.body.slice(0, 2).toString('utf8')).toBe('PK');
  });

  it('rejects non-admin', async () => {
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
