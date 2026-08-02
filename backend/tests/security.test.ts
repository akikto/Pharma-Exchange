import { describe, it, expect } from 'vitest';
import { computeFinalPrice } from '../src/shared/utils/helpers';
import { AppError } from '../src/shared/errors/AppError';

describe('helpers', () => {
  it('formatPrice via computeFinalPrice', () => {
    expect(computeFinalPrice(150, 20)).toBe(120);
  });

  it('generateOtp returns 6 digits', async () => {
    const { generateOtp } = await import('../src/shared/utils/helpers');
    expect(generateOtp()).toMatch(/^\d{6}$/);
  });
});

describe('AppError', () => {
  it('forbidden returns 403', () => {
    const err = AppError.forbidden();
    expect(err.statusCode).toBe(403);
  });
});

describe('authorization', () => {
  it('order getById should require userId parameter', async () => {
    const { orderService } = await import('../src/modules/order/order.service');
    expect(orderService.getById.length).toBe(2);
  });
});
