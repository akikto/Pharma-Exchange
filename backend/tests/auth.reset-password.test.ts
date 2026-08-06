import crypto from 'crypto';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import prisma from '../src/config/database';

vi.mock('../src/shared/services/email.service', () => ({
  isEmailConfigured: vi.fn(() => true),
  sendPasswordResetEmail: vi.fn(async () => undefined),
  EmailConfigError: class EmailConfigError extends Error {},
  EmailDeliveryError: class EmailDeliveryError extends Error {},
}));

import { sendPasswordResetEmail } from '../src/shared/services/email.service';

describe('POST /api/v1/auth/forgot-password', () => {
  const app = createApp();

  beforeEach(() => {
    vi.mocked(sendPasswordResetEmail).mockClear();
  });

  it('returns generic success for unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: `unknown-${Date.now()}@example.com` });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account exists/i);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends reset email for existing account without revealing existence', async () => {
    const email = `forgot-${Date.now()}@example.com`;
    await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('password123', 4),
        firstName: 'Forgot',
        lastName: 'User',
        authProvider: 'email',
      },
    });

    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account exists/i);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      email,
      expect.stringMatching(/\/reset-password\?token=/),
    );
  });
});

describe('POST /api/v1/auth/reset-password', () => {
  const app = createApp();

  function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  it('rejects phone-based reset payloads', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ phone: '+8801712345678', code: '123456', newPassword: 'newpassword99' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.accessToken).toBeUndefined();
  });

  it('resets password with valid token and does not issue JWT', async () => {
    const email = `reset-${Date.now()}@example.com`;
    const oldPassword = 'password123';
    const newPassword = 'newpassword99';
    const rawToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(oldPassword, 4),
        firstName: 'Reset',
        lastName: 'User',
        authProvider: 'email',
      },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/password updated/i);
    expect(res.body.accessToken).toBeUndefined();

    const loginOld = await request(app).post('/api/v1/auth/login').send({ email, password: oldPassword });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app).post('/api/v1/auth/login').send({ email, password: newPassword });
    expect(loginNew.status).toBe(200);

    const used = await prisma.passwordResetToken.findFirst({ where: { userId: user.id, tokenHash: hashToken(rawToken) } });
    expect(used?.usedAt).toBeTruthy();
  });

  it('rejects expired token', async () => {
    const email = `expired-${Date.now()}@example.com`;
    const rawToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('password123', 4),
        firstName: 'Expired',
        lastName: 'User',
        authProvider: 'email',
      },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, newPassword: 'newpassword99' });

    expect(res.status).toBe(400);
    expect(res.body.accessToken).toBeUndefined();
  });

  it('rejects invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: crypto.randomBytes(32).toString('hex'), newPassword: 'newpassword99' });

    expect(res.status).toBe(400);
    expect(res.body.accessToken).toBeUndefined();
  });
});
