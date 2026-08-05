import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

/**
 * Registration flow (BL-01 — MSG91 SMS OTP):
 *  - Email-only registration issues tokens immediately (no OTP).
 *  - Phone registration sends an OTP via MSG91 and requires a verify step.
 *  - No devOtp field is ever exposed.
 */
describe('POST /api/v1/auth/register', () => {
  const app = createApp();
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => new Response('{}'));
    fetchSpy.mockReset();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('email-only registration issues tokens immediately and never leaks OTP fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Email',
        lastName: 'Only',
        email: `email-only-${Date.now()}@example.com`,
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('devOtp');
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('phone registration delegates OTP delivery to MSG91 and requires verification', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ type: 'success', request_id: 'req-123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const phone = `+88017${String(Date.now()).slice(-8)}`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Phone',
        lastName: 'User',
        phone,
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.requiresOtpVerification).toBe(true);
    expect(res.body.otpRequestId).toBe('req-123');
    expect(res.body).not.toHaveProperty('devOtp');
    expect(res.body).not.toHaveProperty('accessToken');

    // Verify the outbound MSG91 call used the correct endpoint and headers.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [urlArg, initArg] = fetchSpy.mock.calls[0]!;
    expect(String(urlArg)).toContain('https://control.msg91.com/api/v5/otp');
    expect(String(urlArg)).toContain(`template_id=${process.env.MSG91_TEMPLATE_ID}`);
    expect((initArg as RequestInit).method).toBe('POST');
    expect(((initArg as RequestInit).headers as Record<string, string>).authkey).toBe(process.env.MSG91_AUTH_KEY);
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
    expect(res.body).not.toHaveProperty('devOtp');
  });

  it('surfaces a friendly error when MSG91 fails', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ type: 'error', message: 'invalid template' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const phone = `+88017${String(Date.now()).slice(-8)}`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Fail',
        lastName: 'Case',
        phone,
        password: 'password123',
      });

    expect(res.status).toBe(502);
    expect(res.body.code).toBe('OTP_PROVIDER_ERROR');
  });
});
