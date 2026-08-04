import { describe, expect, it } from 'vitest';
import { getNotificationRoute } from '@/lib/notification-routes';

describe('getNotificationRoute', () => {
  it('maps order notifications', () => {
    expect(getNotificationRoute({ orderId: 'abc' })).toBe('/orders/abc');
    expect(getNotificationRoute({ orderId: 'abc', role: 'seller' })).toBe('/seller/orders/abc');
  });

  it('maps chat notifications', () => {
    expect(getNotificationRoute({ conversationId: 'c1' })).toBe('/chat/c1');
  });

  it('maps buy request notifications', () => {
    expect(getNotificationRoute({ buyRequestId: 'br1' })).toBe('/buy-requests/br1');
    expect(getNotificationRoute({ buyRequestId: 'br1', role: 'seller' })).toBe('/seller/requests/br1');
  });

  it('maps listing and pharmacy notifications', () => {
    expect(getNotificationRoute({ listingId: 'l1' })).toBe('/medicine/l1');
    expect(getNotificationRoute({ pharmacyId: 'p1' })).toBe('/pharmacy/p1');
  });

  it('returns null when no known keys', () => {
    expect(getNotificationRoute({})).toBeNull();
    expect(getNotificationRoute(undefined)).toBeNull();
  });
});
