import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('POST /api/v1/auth/reset-password', () => {
  const app = createApp();
  const email = `reset-test-${Date.now()}@example.com`;
  const password = 'password123';
  const newPassword = 'newpassword99';

  it('resets password and returns tokens', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ firstName: 'Reset', lastName: 'Test', email, password });

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ email, newPassword });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: newPassword });

    expect(login.status).toBe(200);
  });
});
