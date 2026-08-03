import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('AI Matches API', () => {
  const app = createApp();
  let token = '';

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@pharmex.bd', password: 'password123' });
    expect(login.status).toBe(200);
    token = login.body.accessToken;
  });

  it('GET /ai-matches returns scored suggestions', async () => {
    const res = await request(app)
      .get('/api/v1/ai-matches')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(['rules', 'gemini']).toContain(res.body.source);
    if (res.body.data.length > 0) {
      expect(res.body.data[0].score).toBeGreaterThan(0);
      expect(res.body.data[0].listing).toBeTruthy();
    }
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/ai-matches');
    expect(res.status).toBe(401);
  });
});
