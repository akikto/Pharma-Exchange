import { describe, it, expect } from 'vitest';
import { BuyRequestStatus } from '@prisma/client';
import { BUY_REQUEST_SELLER_RESPONSE_DAYS } from '../src/modules/buy-request/buyRequest.constants';
import {
  effectiveBuyRequestStatus,
  isBuyRequestPastExpiry,
  sellerCanRespondToBuyRequest,
} from '../src/modules/buy-request/buyRequest.expiry';

describe('buy request expiry helpers', () => {
  const now = new Date('2026-08-25T12:00:00.000Z');

  it('uses a 3-day seller response window constant', () => {
    expect(BUY_REQUEST_SELLER_RESPONSE_DAYS).toBe(3);
  });

  it('detects past expiry for pending requests', () => {
    expect(
      isBuyRequestPastExpiry(
        { status: BuyRequestStatus.PENDING, expiresAt: new Date('2026-08-24T12:00:00.000Z') },
        now,
      ),
    ).toBe(true);
    expect(
      isBuyRequestPastExpiry(
        { status: BuyRequestStatus.PENDING, expiresAt: new Date('2026-08-26T12:00:00.000Z') },
        now,
      ),
    ).toBe(false);
  });

  it('treats pending past expiry as EXPIRED for display', () => {
    expect(
      effectiveBuyRequestStatus(
        { status: BuyRequestStatus.PENDING, expiresAt: new Date('2026-08-24T12:00:00.000Z') },
        now,
      ),
    ).toBe(BuyRequestStatus.EXPIRED);
  });

  it('blocks seller respond when expired', () => {
    expect(
      sellerCanRespondToBuyRequest(
        { status: BuyRequestStatus.PENDING, expiresAt: new Date('2026-08-24T12:00:00.000Z') },
        now,
      ),
    ).toBe(false);
    expect(
      sellerCanRespondToBuyRequest(
        { status: BuyRequestStatus.PENDING, expiresAt: new Date('2026-08-28T12:00:00.000Z') },
        now,
      ),
    ).toBe(true);
  });
});
