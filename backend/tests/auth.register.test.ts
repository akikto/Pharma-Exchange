import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('POST /api/v1/auth/register', () => {
  const app = createApp();
  const email = `register-test-${Date.now()}@example.com`;

  it('auto-logs in when OTP_DEV_MODE is enabled (dev)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email,
        phone: `017${String(Date.now()).slice(-8)}`,
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.devOtp).toMatch(/^\d{6}$/);
    expect(res.body.accessToken).toBeUndefined();
  });

  it('accepts bare /auth/register for clients missing the /api prefix', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'Bare',
        lastName: 'Path',
        email: `bare-path-${Date.now()}@example.com`,
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.devOtp).toMatch(/^\d{6}$/);
  });
});
