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

describe('Auth rate limiting (BL-09 · test isolation)', () => {
  const app = createApp();
  let dbAvailable = false;

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
  });

  it('allows repeated logins in test environment without 429', { timeout: 20000 }, async ({ skip }) => {
    if (!dbAvailable) skip();

    const results = [];
    for (let i = 0; i < 12; i++) {
      results.push(
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'buyer@pharmex.bd', password: 'password123' }),
      );
    }

    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(results.some((r) => r.status === 429)).toBe(false);
  });
});
