import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Bulk Request API', () => {
  const app = createApp();
  let token = '';
  let medicineId = '';

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'seller@pharmex.bd', password: 'password123' });
    expect(login.status).toBe(200);
    token = login.body.accessToken;

    const medicines = await request(app).get('/api/v1/medicines?limit=1');
    medicineId = medicines.body.data[0]?.id;
    expect(medicineId).toBeTruthy();
  });

  it('POST /api/v1/bulk-requests creates request and marketplace listing', async () => {
    const res = await request(app)
      .post('/api/v1/bulk-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        medicineId,
        quantity: 500,
        targetPrice: 12.5,
        urgency: 'HIGH',
        deliveryAddress: '123 Pharma Street, Dhaka',
        phone: '9876543210',
        requiresColdChain: true,
        requiresVatInvoice: true,
        requiresFactorySealed: false,
        expiryPreset: 'SIX_MONTHS',
        note: 'Bulk procurement test',
      });

    expect(res.status).toBe(201);
    expect(res.body.requestNumber).toMatch(/^BLK-/);
    expect(res.body.listingId).toBeTruthy();
    expect(res.body.listing.status).toBe('ACTIVE');
    expect(res.body.listing.availableQty).toBe(500);
  });

  it('GET /api/v1/bulk-requests lists pharmacy bulk requests', async () => {
    const res = await request(app)
      .get('/api/v1/bulk-requests')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('rejects CUSTOM expiry without customExpiryDays', async () => {
    const res = await request(app)
      .post('/api/v1/bulk-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        medicineId,
        quantity: 100,
        targetPrice: 10,
        deliveryAddress: 'Dhaka',
        phone: '9876543211',
        expiryPreset: 'CUSTOM',
      });

    expect(res.status).toBe(400);
  });
});
