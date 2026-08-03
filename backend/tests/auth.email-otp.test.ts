import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { generateOtp } from '../src/shared/utils/helpers';

describe('Email OTP password reset', () => {
  const app = createApp();
  const email = `email-otp-${Date.now()}@example.com`;
  const password = 'password123';
  const newPassword = 'newpass99';

  beforeAll(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ firstName: 'OTP', lastName: 'Test', email, password });
  });

  it('POST /forgot-password returns generic message without exposing OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('If an account exists');
    expect(res.body.devOtp).toBeTruthy();
    expect(res.body.otp).toBeUndefined();
    expect(res.body.code).toBeUndefined();
  });

  it('stores hashed OTP in database', async () => {
    const record = await prisma.emailOtp.findFirst({
      where: { email: email.toLowerCase() },
      orderBy: { createdAt: 'desc' },
    });
    expect(record).toBeTruthy();
    expect(record!.hashedOtp).not.toMatch(/^\d{6}$/);
    expect(record!.verified).toBe(false);
    expect(record!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects invalid OTP and increments attempts', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email-otp')
      .send({ email, code: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid');

    const record = await prisma.emailOtp.findFirst({
      where: { email: email.toLowerCase() },
      orderBy: { createdAt: 'desc' },
    });
    expect(record!.attempts).toBeGreaterThanOrEqual(1);
  });

  it('verifies valid OTP and returns reset token', async () => {
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 12);
    await prisma.emailOtp.deleteMany({ where: { email: email.toLowerCase() } });
    await prisma.emailOtp.create({
      data: {
        email: email.toLowerCase(),
        hashedOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post('/api/v1/auth/verify-email-otp')
      .send({ email, code: otp });

    expect(res.status).toBe(200);
    expect(res.body.resetToken).toBeTruthy();
    expect(res.body.expiresIn).toBe(900);

    const remaining = await prisma.emailOtp.count({ where: { email: email.toLowerCase() } });
    expect(remaining).toBe(0);
  });

  it('resets password with valid reset token', async () => {
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 12);
    await prisma.emailOtp.create({
      data: {
        email: email.toLowerCase(),
        hashedOtp,
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

  it('rejects expired OTP', async () => {
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 12);
    await prisma.emailOtp.deleteMany({ where: { email: email.toLowerCase() } });
    await prisma.emailOtp.create({
      data: {
        email: email.toLowerCase(),
        hashedOtp,
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const res = await request(app)
      .post('/api/v1/auth/verify-email-otp')
      .send({ email, code: otp });

    expect(res.status).toBe(400);
  });

  it('rejects reset without valid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ resetToken: 'invalid-token', newPassword: 'another99' });

    expect(res.status).toBe(401);
  });

  it('rejects weak password on reset', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ resetToken: 'invalid', newPassword: 'short' });

    expect(res.status).toBe(400);
  });

  it('forgot-password for unknown email still returns 200', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: `nobody-${Date.now()}@example.com` });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('If an account exists');
  });
});

describe('generateOtp', () => {
  it('generates 6-digit numeric codes', () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
      expect(parseInt(otp, 10)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp, 10)).toBeLessThanOrEqual(999999);
    }
  });
});
