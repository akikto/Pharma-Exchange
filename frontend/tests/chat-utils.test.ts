import { describe, it, expect } from 'vitest';
import { getSellerOrderAction, getSellerBuyRequestActions, buildConversationQuery } from '@/lib/chat-utils';

describe('chat-utils', () => {
  it('returns seller order progression actions', () => {
    expect(getSellerOrderAction('CONFIRMED')?.status).toBe('PACKED');
    expect(getSellerOrderAction('DELIVERED')).toBeNull();
  });

  it('returns buy request actions when pending', () => {
    expect(getSellerBuyRequestActions('PENDING')).toHaveLength(2);
    expect(getSellerBuyRequestActions('ACCEPTED')).toHaveLength(0);
    expect(getSellerBuyRequestActions('PENDING', '2020-01-01T00:00:00.000Z')).toHaveLength(0);
  });

  it('buildConversationQuery encodes filter', () => {
    expect(buildConversationQuery({ type: 'order', id: 'o1' })).toBe('?orderId=o1');
    expect(buildConversationQuery({ type: 'all' })).toBe('');
  });
});
