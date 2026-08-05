import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import prisma from '../src/config/database';

describe('POST /api/v1/auth/reset-password', () => {
  const app = createApp();
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('rejects email-only reset payloads', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ email: 'someone@example.com', newPassword: 'newpassword99' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.accessToken).toBeUndefined();
  });

  it('resets password after verified OTP and does not issue JWT', async () => {
    const phone = `8801713${String(Date.now()).slice(-6)}`;
    const password = 'password123';
    const newPassword = 'newpassword99';

    await prisma.user.create({
      data: {
        phone,
        passwordHash: await bcrypt.hash(password, 4),
        firstName: 'Reset',
        lastName: 'User',
        authProvider: 'phone',
      },
    });

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ type: 'success', message: 'OTP verified' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ phone: `+${phone}`, code: '123456', newPassword });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/password updated/i);
    expect(res.body.accessToken).toBeUndefined();

    const loginOld = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone, password });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone, password: newPassword });
    expect(loginNew.status).toBe(200);
  });

  it('rejects invalid OTP', async () => {
    const phone = `8801714${String(Date.now()).slice(-6)}`;
    const newPassword = 'newpassword99';

    await prisma.user.create({
      data: {
        phone,
        passwordHash: await bcrypt.hash('password123', 4),
        firstName: 'Reset',
        lastName: 'User',
        authProvider: 'phone',
      },
    });

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ type: 'error', message: 'wrong otp' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ phone: `+${phone}`, code: '999999', newPassword });

    expect([400, 502]).toContain(res.status);
    expect(res.body.accessToken).toBeUndefined();
  });
});
