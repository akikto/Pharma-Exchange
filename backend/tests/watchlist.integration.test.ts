import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Watchlist & Price Alerts API', () => {
  const app = createApp();
  let token = '';
  let medicineId = '';
  let priceAlertId = '';

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@pharmex.bd', password: 'password123' });
    expect(login.status).toBe(200);
    token = login.body.accessToken;

    const medicines = await request(app).get('/api/v1/medicines?limit=1');
    medicineId = medicines.body.data[0]?.id;
    expect(medicineId).toBeTruthy();
  });

  it('POST /watchlist adds medicine and GET returns price summary', async () => {
    const add = await request(app)
      .post('/api/v1/watchlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicineId });
    expect(add.status).toBe(201);

    const list = await request(app)
      .get('/api/v1/watchlist')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((i: { medicineId: string }) => i.medicineId === medicineId)).toBe(true);
    const item = list.body.data.find((i: { medicineId: string }) => i.medicineId === medicineId);
    expect(item.priceTrend).toBeDefined();
  });

  it('POST /price-alerts sets threshold and PATCH toggles', async () => {
    const create = await request(app)
      .post('/api/v1/price-alerts')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicineId, maxPrice: 50 });
    expect(create.status).toBe(200);
    priceAlertId = create.body.id;

    const toggle = await request(app)
      .patch(`/api/v1/price-alerts/${priceAlertId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isEnabled: false });
    expect(toggle.status).toBe(200);
    expect(toggle.body.isEnabled).toBe(false);
  });

  it('POST /price-alerts/triggered/simulate creates demo alert', async () => {
    await request(app)
      .patch(`/api/v1/price-alerts/${priceAlertId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isEnabled: true });

    const sim = await request(app)
      .post('/api/v1/price-alerts/triggered/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicineId, listingPrice: 25 });
    expect(sim.status).toBe(201);
    expect(sim.body.isSimulated).toBe(true);

    const inbox = await request(app)
      .get('/api/v1/price-alerts/triggered')
      .set('Authorization', `Bearer ${token}`);
    expect(inbox.status).toBe(200);
    expect(inbox.body.data.length).toBeGreaterThan(0);
  });

  it('DELETE /watchlist/:medicineId removes item', async () => {
    const res = await request(app)
      .delete(`/api/v1/watchlist/${medicineId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
