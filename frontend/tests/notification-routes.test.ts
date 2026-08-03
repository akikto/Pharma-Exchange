import { describe, expect, it } from 'vitest';
import { getNotificationRoute } from '@/lib/notification-routes';

describe('getNotificationRoute', () => {
  it('maps order notifications', () => {
    expect(getNotificationRoute({ orderId: 'abc' })).toBe('/orders/abc');
  });

  it('maps chat notifications', () => {
    expect(getNotificationRoute({ conversationId: 'c1' })).toBe('/chat/c1');
  });

  it('maps buy request notifications', () => {
    expect(getNotificationRoute({ buyRequestId: 'br1' })).toBe('/buy-requests/br1');
  });

  it('returns null when no known keys', () => {
    expect(getNotificationRoute({})).toBeNull();
    expect(getNotificationRoute(undefined)).toBeNull();
  });
});
