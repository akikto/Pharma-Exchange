import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { createListingSchema } from '../src/modules/listing/listing.validation';

describe('createListingSchema', () => {
  const validBody = {
    medicineId: '550e8400-e29b-41d4-a716-446655440000',
    batchNumber: 'Fr12',
    mfgDate: new Date('2025-01-01').toISOString(),
    expiryDate: new Date('2027-12-31').toISOString(),
    purchasePrice: 25,
    sellingPrice: 30,
    discountPercent: 20,
    availableQty: 10,
    moq: 1,
    status: 'ACTIVE',
  };

  it('rejects empty medicineId with a clear message', () => {
    const result = createListingSchema.safeParse({ ...validBody, medicineId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const medicineError = result.error.errors.find((e) => e.path[0] === 'medicineId');
      expect(medicineError?.message).toBe('Medicine selection is required.');
    }
  });

  it('accepts a valid medicine UUID', () => {
    expect(createListingSchema.safeParse(validBody).success).toBe(true);
  });

  it('allows lowStockThreshold to be omitted', () => {
    const result = createListingSchema.safeParse(validBody);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lowStockThreshold).toBeUndefined();
    }
  });
});

describe('POST /api/v1/listings', () => {
  const app = createApp();
  let token = '';

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'seller@pharmex.bd', password: 'password123' });
    expect(login.status).toBe(200);
    token = login.body.accessToken;
  });

  it('returns validation error when medicineId is empty', async () => {
    const res = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        medicineId: '',
        batchNumber: 'Fr12',
        mfgDate: new Date('2025-01-01').toISOString(),
        expiryDate: new Date('2027-12-31').toISOString(),
        purchasePrice: 25,
        sellingPrice: 30,
        discountPercent: 20,
        availableQty: 10,
        moq: 1,
        status: 'ACTIVE',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'medicineId',
          message: 'Medicine selection is required.',
        }),
      ]),
    );
  });

  it('creates a listing with a valid medicine UUID', async () => {
    const meds = await request(app).get('/api/v1/medicines?q=para&limit=1');
    const medicineId = meds.body.data[0].id;

    const res = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        medicineId,
        batchNumber: `Fr12-${Date.now()}`,
        mfgDate: new Date('2025-01-01').toISOString(),
        expiryDate: new Date('2027-12-31').toISOString(),
        purchasePrice: 25,
        sellingPrice: 30,
        discountPercent: 20,
        availableQty: 10,
        moq: 1,
        status: 'ACTIVE',
      });

    expect(res.status).toBe(201);
    expect(res.body.medicineId).toBe(medicineId);
    expect(res.body.lowStockThreshold).toBeNull();
  });
});
