import { describe, expect, it } from 'vitest';
import { AppError } from '../src/shared/errors/AppError.js';

/** Authorization logic mirrors orderService.getById access checks */
function canAccessOrder(
  order: { buyerId: string; sellerId: string },
  userId: string,
  role: string
): boolean {
  if (role === 'ADMIN') return true;
  return order.buyerId === userId || order.sellerId === userId;
}

function canAccessBuyRequest(
  request: { buyerId: string; sellerId: string | null },
  userId: string,
  role: string
): boolean {
  if (role === 'ADMIN') return true;
  return request.buyerId === userId || request.sellerId === userId;
}

describe('authorization helpers', () => {
  it('allows buyer and seller on orders', () => {
    const order = { buyerId: 'b1', sellerId: 's1' };
    expect(canAccessOrder(order, 'b1', 'BUYER')).toBe(true);
    expect(canAccessOrder(order, 's1', 'SELLER')).toBe(true);
    expect(canAccessOrder(order, 'other', 'BUYER')).toBe(false);
    expect(canAccessOrder(order, 'other', 'ADMIN')).toBe(true);
  });

  it('allows buyer and assigned seller on buy requests', () => {
    const req = { buyerId: 'b1', sellerId: 's1' };
    expect(canAccessBuyRequest(req, 'b1', 'BUYER')).toBe(true);
    expect(canAccessBuyRequest(req, 's1', 'SELLER')).toBe(true);
    expect(canAccessBuyRequest(req, 'other', 'BUYER')).toBe(false);
  });

  it('maps forbidden access to AppError', () => {
    const err = AppError.forbidden();
    expect(err.statusCode).toBe(403);
  });
});
