import { describe, it, expect } from 'vitest';

const SELLER_ORDER_NEXT: Record<string, { status: string; labelKey: string } | undefined> = {
  CONFIRMED: { status: 'PACKED', labelKey: 'chat.markPacked' },
  PACKED: { status: 'SHIPPED', labelKey: 'chat.markShipped' },
  SHIPPED: { status: 'DELIVERED', labelKey: 'chat.markDelivered' },
};

function getSellerOrderAction(orderStatus: string) {
  const next = SELLER_ORDER_NEXT[orderStatus];
  if (!next) return null;
  return { key: next.status, labelKey: next.labelKey, status: next.status };
}

function formatOrderStatusMessage(status: string, orderNumber: string): string {
  return `Order ${orderNumber} status updated to ${status.toLowerCase()}`;
}

function formatBuyRequestStatusMessage(status: string, requestNumber: string): string {
  const label = status === 'ACCEPTED' ? 'accepted' : status === 'REJECTED' ? 'rejected' : status.toLowerCase();
  return `Buy request ${requestNumber} was ${label}`;
}

describe('chat system message formatting', () => {
  it('formats order status updates', () => {
    expect(formatOrderStatusMessage('PACKED', 'ORD-001')).toContain('packed');
    expect(formatOrderStatusMessage('PACKED', 'ORD-001')).toContain('ORD-001');
  });

  it('formats buy request outcomes', () => {
    expect(formatBuyRequestStatusMessage('REJECTED', 'BR-001')).toContain('rejected');
    expect(formatBuyRequestStatusMessage('ACCEPTED', 'BR-002')).toContain('accepted');
  });

  it('maps seller order transitions', () => {
    expect(getSellerOrderAction('CONFIRMED')?.status).toBe('PACKED');
    expect(getSellerOrderAction('DELIVERED')).toBeNull();
  });
});
