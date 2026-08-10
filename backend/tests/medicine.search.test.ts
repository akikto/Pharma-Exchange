import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Medicine catalog search', () => {
  const app = createApp();

  it('searches by composition in q parameter', async () => {
    const res = await request(app).get('/api/v1/medicines?q=Paracetamol');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      const match = res.body.data.some((medicine: { composition?: string; genericName?: string; name?: string }) =>
        medicine.composition?.toLowerCase().includes('paracetamol')
        || medicine.genericName?.toLowerCase().includes('paracetamol')
        || medicine.name?.toLowerCase().includes('paracetamol'),
      );
      expect(match).toBe(true);
    }
  });
});
