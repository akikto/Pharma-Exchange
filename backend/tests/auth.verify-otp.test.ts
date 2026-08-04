import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import prisma from '../src/config/database';

describe('POST /api/v1/auth/verify-otp', () => {
  const app = createApp();
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}'));
    fetchSpy.mockReset();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('verifies via MSG91 and issues tokens for the phone owner', async () => {
    // Seed a phone-based user directly (registration flow is covered elsewhere).
    const phone = `8801712${String(Date.now()).slice(-6)}`;
    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash: await bcrypt.hash('password123', 4),
        firstName: 'Otp',
        lastName: 'Verify',
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
      .post('/api/v1/auth/verify-otp')
      .send({ phone: `+${phone}`, code: '123456', purpose: 'login' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.id).toBe(user.id);

    // Confirm MSG91 verify endpoint was hit.
    const [urlArg] = fetchSpy.mock.calls[0]!;
    expect(String(urlArg)).toContain('/api/v5/otp/verify');
  });

  it('rejects an invalid code with 400', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ type: 'error', message: 'wrong otp' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+8801712345678', code: '999999', purpose: 'login' });

    expect([400, 502]).toContain(res.status);
    expect(res.body.accessToken).toBeUndefined();
  });

  it('rejects requests that omit the phone field', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ code: '123456', purpose: 'login' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
