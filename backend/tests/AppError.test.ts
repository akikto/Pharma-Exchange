import { describe, it, expect } from 'vitest';
import { AppError } from '../src/shared/errors/AppError';

describe('AppError', () => {
  it('creates error with status code and code', () => {
    const err = AppError.notFound('Medicine not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Medicine not found');
  });

  it('creates bad request with details', () => {
    const err = AppError.badRequest('Invalid input', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ field: 'email' });
  });
});
