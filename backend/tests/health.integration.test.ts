import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Health endpoints', () => {
  const app = createApp();

  it('GET / returns API metadata', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('pharma-exchange-api');
    expect(res.body.api).toBe('/api/v1');
  });

  it('GET /health returns liveness ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('pharma-exchange-api');
  });

  it('GET /api/v1/health returns readiness with database status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Admin dashboard', () => {
  const app = createApp();

  it('GET /api/v1/admin/dashboard returns analytics for admin user', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@pharmex.bd', password: 'password123' });

    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeDefined();

    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('gmv');
    expect(res.body).toHaveProperty('activePharmacies');
    expect(res.body).toHaveProperty('ordersOverTime');
    expect(Array.isArray(res.body.ordersOverTime)).toBe(true);
  });
});
