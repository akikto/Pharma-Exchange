export type ChatContextFilter =
  | { type: 'all' }
  | { type: 'order'; id: string }
  | { type: 'buyRequest'; id: string };

export interface SellerChatAction {
  key: string;
  labelKey: string;
  status?: string;
  action?: 'accept' | 'reject';
}

const SELLER_ORDER_NEXT: Record<string, { status: string; labelKey: string } | undefined> = {
  CONFIRMED: { status: 'PACKED', labelKey: 'chat.markPacked' },
  PACKED: { status: 'SHIPPED', labelKey: 'chat.markShipped' },
  SHIPPED: { status: 'DELIVERED', labelKey: 'chat.markDelivered' },
};

export function getSellerOrderAction(orderStatus: string): SellerChatAction | null {
  const next = SELLER_ORDER_NEXT[orderStatus];
  if (!next) return null;
  return { key: next.status, labelKey: next.labelKey, status: next.status };
}

import { effectiveBuyRequestStatus } from '@/lib/buy-request-utils';

export function getSellerBuyRequestActions(
  requestStatus: string,
  expiresAt?: string | null,
): SellerChatAction[] {
  const status = expiresAt
    ? effectiveBuyRequestStatus({ status: requestStatus, expiresAt })
    : requestStatus;
  if (status !== 'PENDING') return [];
  return [
    { key: 'accept', labelKey: 'chat.acceptRequest', action: 'accept' },
    { key: 'reject', labelKey: 'chat.rejectRequest', action: 'reject' },
  ];
}

export function buildConversationQuery(filter: ChatContextFilter): string {
  if (filter.type === 'order') return `?orderId=${filter.id}`;
  if (filter.type === 'buyRequest') return `?buyRequestId=${filter.id}`;
  return '';
}
