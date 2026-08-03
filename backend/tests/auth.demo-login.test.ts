import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('POST /api/v1/auth/demo-login', () => {
  const app = createApp();

  it('returns tokens for seeded demo buyer in non-production', async () => {
    const res = await request(app).post('/api/v1/auth/demo-login');
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.email).toBe('buyer@pharmex.bd');
    expect(res.body.isDemo).toBe(true);
  });
});
