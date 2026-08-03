import { describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { generateOtp } from '../src/shared/utils/helpers';

describe('POST /api/v1/auth/reset-password (secure flow)', () => {
  const app = createApp();
  const email = `reset-test-${Date.now()}@example.com`;
  const password = 'password123';
  const newPassword = 'newpassword99';

  it('resets password via OTP verification and returns tokens', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ firstName: 'Reset', lastName: 'Test', email, password });

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

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ resetToken: verify.body.resetToken, newPassword });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Password updated');
    expect(res.body.accessToken).toBeUndefined();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: newPassword });

    expect(login.status).toBe(200);
  });

  it('rejects legacy email-only reset', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ email, newPassword: 'legacypass99' });

    expect(res.status).toBe(400);
  });
});
