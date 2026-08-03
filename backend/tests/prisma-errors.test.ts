import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { mapPrismaError } from '../src/shared/errors/prismaErrors';

describe('mapPrismaError', () => {
  it('maps unique constraint violations to conflict', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.5.0',
      meta: { target: ['email'] },
    });

    const mapped = mapPrismaError(err);
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.code).toBe('CONFLICT');
    expect(mapped?.message).toContain('email');
  });

  it('maps missing column errors to service unavailable', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Column does not exist', {
      code: 'P2022',
      clientVersion: '6.5.0',
    });

    const mapped = mapPrismaError(err);
    expect(mapped?.statusCode).toBe(503);
    expect(mapped?.code).toBe('SERVICE_UNAVAILABLE');
  });
});
