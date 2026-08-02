import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { CartItem, PaginatedResponse, Order, BuyRequest, Notification, SellerAnalytics } from '@/types';

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.get<{ items: CartItem[]; groupedBySeller: Record<string, CartItem[]> }>('/cart'),
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { listingId: string; quantity: number }) => apiClient.post('/cart', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useOrders(role: 'buyer' | 'seller' = 'buyer', status?: string) {
  const params = new URLSearchParams({ role });
  if (status) params.set('status', status);
  return useQuery({
    queryKey: ['orders', role, status],
    queryFn: () => apiClient.get<PaginatedResponse<Order>>(`/orders?${params}`),
  });
}

export function useBuyRequests(role: 'buyer' | 'seller' = 'buyer') {
  return useQuery({
    queryKey: ['buy-requests', role],
    queryFn: () => apiClient.get<PaginatedResponse<BuyRequest>>(`/buy-requests?role=${role}`),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get<{ data: Notification[]; unreadCount: number }>('/notifications'),
  });
}

export function useSellerAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'seller'],
    queryFn: () => apiClient.get<SellerAnalytics>('/analytics/seller'),
  });
}
