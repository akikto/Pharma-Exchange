import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Conversation, Message } from '@/types';
import type { ChatContextFilter } from '@/lib/chat-utils';
import { buildConversationQuery } from '@/lib/chat-utils';

export interface ChatContextOptions {
  orders: { id: string; orderNumber: string; status: string }[];
  buyRequests: { id: string; requestNumber: string; status: string }[];
}

export interface ChatConversationDetail extends Conversation {
  orderId?: string | null;
  buyRequestId?: string | null;
  listingId?: string | null;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: string | number;
    seller?: { userId: string };
  } | null;
  buyRequest?: {
    id: string;
    requestNumber: string;
    status: string;
    totalAmount: string | number;
    seller?: { userId: string };
  } | null;
  counterparty?: { id: string; firstName: string; lastName: string; phone?: string | null } | null;
}

export function useConversations(filter: ChatContextFilter = { type: 'all' }) {
  const qs = buildConversationQuery(filter);
  return useQuery({
    queryKey: ['conversations', filter],
    queryFn: () => apiClient.get<Conversation[]>(`/chat/conversations${qs}`),
  });
}

export function useChatContextOptions() {
  return useQuery({
    queryKey: ['chat-context-options'],
    queryFn: () => apiClient.get<ChatContextOptions>('/chat/context-options'),
  });
}

export function useConversation(id?: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => apiClient.get<ChatConversationDetail>(`/chat/conversations/${id}`),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiClient.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation'] });
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRespondBuyRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'reject' }) =>
      apiClient.post(`/buy-requests/${id}/respond`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation'] });
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['buy-requests'] });
    },
  });
}

export type { Message };
