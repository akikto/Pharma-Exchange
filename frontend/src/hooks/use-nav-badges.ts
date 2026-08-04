import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useWatchlistCount } from '@/hooks/use-watchlist';
import type { BuyRequest, Conversation } from '@/types';

export function useNavBadges() {
  const mode = useAuthStore((s) => s.mode);
  const userId = useAuthStore((s) => s.user?.id);

  const { data: cart } = useCart();
  const cartCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const watchlistCount = useWatchlistCount();

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get<{ unreadCount: number }>('/notifications'),
    refetchInterval: 60_000,
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.get<Conversation[]>('/chat/conversations'),
    refetchInterval: 30_000,
  });

  const chatUnread = (conversations ?? []).filter((conv) => {
    const last = conv.messages?.[0];
    return Boolean(last?.sender?.id && last.sender.id !== userId && !last.isRead);
  }).length;

  const { data: sellerRequests } = useQuery({
    queryKey: ['buy-requests', 'seller'],
    queryFn: () => apiClient.get<{ data: BuyRequest[] }>('/buy-requests?role=seller'),
    enabled: mode === 'seller',
    refetchInterval: 60_000,
  });

  const pendingRequests = mode === 'seller'
    ? (sellerRequests?.data?.filter((r) => r.status === 'PENDING').length ?? 0)
    : 0;

  return {
    cart: cartCount,
    chat: chatUnread,
    requests: pendingRequests,
    watchlist: watchlistCount,
    notifications: notifications?.unreadCount ?? 0,
  };
}
