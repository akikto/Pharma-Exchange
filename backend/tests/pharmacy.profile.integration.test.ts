import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Pharmacy Profile API', () => {
  const app = createApp();
  let pharmacyId = '';

  beforeAll(async () => {
    const shops = await request(app).get('/api/v1/pharmacies/demo-shops');
    expect(shops.status).toBe(200);
    expect(shops.body.length).toBeGreaterThan(0);
    pharmacyId = shops.body[0].id;
  });

  it('GET /pharmacies/demo-shops lists approved pharmacies', async () => {
    const res = await request(app).get('/api/v1/pharmacies/demo-shops');
    expect(res.status).toBe(200);
    expect(res.body.every((p: { verificationStatus: string }) => p.verificationStatus === 'APPROVED')).toBe(true);
  });

  it('GET /pharmacies/:id returns full public profile', async () => {
    const res = await request(app).get(`/api/v1/pharmacies/${pharmacyId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBeTruthy();
    expect(res.body.licenseNumber).toBeTruthy();
    expect(res.body.address).toBeTruthy();
    expect(res.body.owner?.name).toBeTruthy();
    expect(typeof res.body.dealsCompleted).toBe('number');
  });
});
