import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Listing marketplace search filters', () => {
  const app = createApp();

  it('GET /api/v1/listings/search returns paginated results', async () => {
    const res = await request(app).get('/api/v1/listings/search');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('filters by minDiscount', async () => {
    const res = await request(app).get('/api/v1/listings/search?minDiscount=50');
    expect(res.status).toBe(200);
    for (const listing of res.body.data) {
      expect(listing.discountPercent).toBeGreaterThanOrEqual(50);
    }
  });

  it('filters by dosageForm', async () => {
    const res = await request(app).get('/api/v1/listings/search?dosageForm=SYRUP');
    expect(res.status).toBe(200);
    for (const listing of res.body.data) {
      expect(listing.medicine.dosageForm).toBe('SYRUP');
    }
  });

  it('filters by maxExpiryDays', async () => {
    const res = await request(app).get('/api/v1/listings/search?maxExpiryDays=30');
    expect(res.status).toBe(200);
    const now = Date.now();
    for (const listing of res.body.data) {
      const days = (new Date(listing.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24);
      expect(days).toBeLessThanOrEqual(30);
    }
  });

  it('filters by minAvailableQty (overstock)', async () => {
    const res = await request(app).get('/api/v1/listings/search?minAvailableQty=50');
    expect(res.status).toBe(200);
    for (const listing of res.body.data) {
      expect(listing.availableQty).toBeGreaterThanOrEqual(50);
    }
  });

  it('sorts by recommended', async () => {
    const res = await request(app).get('/api/v1/listings/search?sortBy=recommended');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filters by geo radius when coordinates provided', async () => {
    const res = await request(app).get(
      '/api/v1/listings/search?latitude=23.7461&longitude=90.3742&radiusKm=5',
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Medicine alternatives', () => {
  const app = createApp();

  it('GET /api/v1/medicines/:id/alternatives returns generic matches', async () => {
    const medicines = await request(app).get('/api/v1/medicines?q=Napa');
    expect(medicines.status).toBe(200);
    const id = medicines.body.data[0]?.id;
    if (!id) return;

    const res = await request(app).get(`/api/v1/medicines/${id}/alternatives`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const alt of res.body.data) {
      expect(alt.id).not.toBe(id);
    }
  });
});
