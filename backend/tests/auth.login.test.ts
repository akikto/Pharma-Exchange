import { describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { generateOtp } from '../src/shared/utils/helpers';

describe('POST /api/v1/auth/login (email + password — unchanged)', () => {
  const app = createApp();
  const email = `login-test-${Date.now()}@example.com`;
  const password = 'password123';

  it('logs in with email and password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ firstName: 'Login', lastName: 'Test', email, password });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });

  it('rejects wrong password without affecting account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'wrongpassword' });

    expect(res.status).toBe(401);

    const ok = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    expect(ok.status).toBe(200);
  });

  it('logs in with new password after OTP password reset flow', async () => {
    const newPassword = 'resetpass99';
    const otp = generateOtp();
    await prisma.emailOtp.create({
      data: {
        email: email.toLowerCase(),
        hashedOtp: await bcrypt.hash(otp, 12),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const verify = await request(app)
      .post('/api/v1/auth/verify-email-otp')
      .send({ email, code: otp });

    const reset = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ resetToken: verify.body.resetToken, newPassword });

    expect(reset.status).toBe(200);
    expect(reset.body.message).toContain('Password updated');
    expect(reset.body.accessToken).toBeUndefined();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: newPassword });

    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();
  });

  it('rejects legacy send-otp for password_reset purpose', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ email, purpose: 'password_reset' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('forgot-password');
  });
});
