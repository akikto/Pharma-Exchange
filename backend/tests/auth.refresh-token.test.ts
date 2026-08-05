import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';

async function isDatabaseAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe('POST /api/v1/auth/refresh (BL-09 · token rotation)', () => {
  const app = createApp();
  let dbAvailable = false;

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
  });

  it('rotates refresh token and invalidates the old one', async ({ skip }) => {
    if (!dbAvailable) skip();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@pharmex.bd', password: 'password123' });
    expect(login.status).toBe(200);

    const oldRefresh = login.body.refreshToken as string;
    const oldAccess = login.body.accessToken as string;

    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeTruthy();
    expect(refresh.body.refreshToken).toBeTruthy();
    expect(refresh.body.refreshToken).not.toBe(oldRefresh);

    const stale = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefresh });
    expect(stale.status).toBe(401);

    const profile = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${refresh.body.accessToken}`);
    expect(profile.status).toBe(200);

    const oldAccessProfile = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${oldAccess}`);
    expect(oldAccessProfile.status).toBe(200);
  });

  it('rejects invalid refresh tokens', async ({ skip }) => {
    if (!dbAvailable) skip();

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-valid-refresh-token' });
    expect(res.status).toBe(401);
  });

  it('logout removes refresh token from rotation', async ({ skip }) => {
    if (!dbAvailable) skip();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@pharmex.bd', password: 'password123' });
    expect(login.status).toBe(200);

    const token = login.body.refreshToken as string;
    const access = login.body.accessToken as string;

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${access}`)
      .send({ refreshToken: token });
    expect(logout.status).toBe(200);

    const afterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: token });
    expect(afterLogout.status).toBe(401);
  });
});
