import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

/**
 * Registration flow:
 *  - Email and phone registration issue tokens immediately (no OTP).
 */
describe('POST /api/v1/auth/register', () => {
  const app = createApp();

  it('email-only registration issues tokens immediately', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Email',
        lastName: 'Only',
        email: `email-only-${Date.now()}@example.com`,
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it('phone registration issues tokens immediately', async () => {
    const phone = `88017${String(Date.now()).slice(-8)}`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Phone',
        lastName: 'User',
        phone,
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it('accepts bare /auth/register for clients missing the /api prefix (email-only)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'Bare',
        lastName: 'Path',
        email: `bare-path-${Date.now()}@example.com`,
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });
});
