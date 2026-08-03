import { describe, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { errorHandler } from '../src/shared/errors/errorHandler';

function createMockRes() {
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
  };
  return res as Response & { statusCode: number; body: unknown };
}

describe('errorHandler', () => {
  it('returns 503 for Prisma schema mismatch errors', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Column does not exist', {
      code: 'P2022',
      clientVersion: '6.5.0',
    });
    const res = createMockRes();

    errorHandler(err, {} as Request, res, vi.fn() as NextFunction);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      error: expect.stringContaining('schema is out of date'),
    });
  });
});
