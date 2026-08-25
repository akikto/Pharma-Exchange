import { describe, expect, it } from 'vitest';
import {
  canBuyerResendBuyRequest,
  canSellerRespondToBuyRequest,
  effectiveBuyRequestStatus,
  isBuyRequestExpired,
} from '@/lib/buy-request-utils';

describe('buy-request-utils', () => {
  const past = '2026-08-20T00:00:00.000Z';
  const future = '2026-08-30T00:00:00.000Z';

  it('treats pending past expiresAt as expired', () => {
    expect(isBuyRequestExpired({ status: 'PENDING', expiresAt: past })).toBe(true);
    expect(effectiveBuyRequestStatus({ status: 'PENDING', expiresAt: past })).toBe('EXPIRED');
  });

  it('allows seller respond only while pending and not expired', () => {
    expect(canSellerRespondToBuyRequest({ status: 'PENDING', expiresAt: future })).toBe(true);
    expect(canSellerRespondToBuyRequest({ status: 'PENDING', expiresAt: past })).toBe(false);
    expect(canSellerRespondToBuyRequest({ status: 'EXPIRED', expiresAt: past })).toBe(false);
  });

  it('allows buyer resend only when expired', () => {
    expect(canBuyerResendBuyRequest({ status: 'EXPIRED', expiresAt: past })).toBe(true);
    expect(canBuyerResendBuyRequest({ status: 'PENDING', expiresAt: future })).toBe(false);
  });
});
