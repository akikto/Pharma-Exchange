import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

vi.mock('../src/app', () => ({
  createApp: vi.fn(() => {
    throw new Error('Express should not bootstrap for liveness probes');
  }),
}));

import handler from '../api/index';

function createMockRes(): VercelResponse & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 0,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader: vi.fn(),
    end: vi.fn(),
  };
  return res as VercelResponse & { statusCode: number; body: unknown };
}

describe('Vercel serverless handler liveness probes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['/', '/health', '/api', '/api/', '', '/?deploy=preview'])(
    'responds without Express bootstrap for %s',
    async (url) => {
      const req = { url, method: 'GET', headers: {} } as VercelRequest;
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        status: 'ok',
        service: 'pharma-exchange-api',
        runtime: 'vercel-serverless',
      });
    },
  );
});
