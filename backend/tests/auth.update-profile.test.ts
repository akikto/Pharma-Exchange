import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('PATCH /api/v1/auth/me', () => {
  const app = createApp();

  async function loginDemo() {
    const res = await request(app).post('/api/v1/auth/demo-login').send({});
    expect(res.status).toBe(200);
    return res.body.accessToken as string;
  }

  it('updates language, theme, and notification preferences', async () => {
    const token = await loginDemo();

    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        language: 'bn',
        theme: 'dark',
        notificationPrefs: { promotions: true, chat: false },
      });

    expect(res.status).toBe(200);
    expect(res.body.language).toBe('bn');
    expect(res.body.theme).toBe('dark');
    expect(res.body.notificationPrefs.promotions).toBe(true);
    expect(res.body.notificationPrefs.chat).toBe(false);
  });
});
