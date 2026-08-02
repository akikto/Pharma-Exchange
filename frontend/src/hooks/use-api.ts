import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { CartItem, PaginatedResponse, Order, BuyRequest, Notification, SellerAnalytics, Listing, Medicine, User } from '@/types';

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

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId: string) => apiClient.delete(`/cart/${cartItemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      apiClient.patch(`/cart/${id}`, { quantity }),
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

export function useOrder(id?: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.get<Order>(`/orders/${id}`),
    enabled: !!id,
  });
}

export function useBuyRequests(role: 'buyer' | 'seller' = 'buyer') {
  return useQuery({
    queryKey: ['buy-requests', role],
    queryFn: () => apiClient.get<PaginatedResponse<BuyRequest>>(`/buy-requests?role=${role}`),
  });
}

export function useBuyRequest(id?: string) {
  return useQuery({
    queryKey: ['buy-request', id],
    queryFn: () => apiClient.get<BuyRequest>(`/buy-requests/${id}`),
    enabled: !!id,
  });
}

export function useSellerInventory(status?: string) {
  const params = status ? `?status=${status}` : '';
  return useQuery({
    queryKey: ['seller-inventory', status],
    queryFn: () => apiClient.get<PaginatedResponse<Listing>>(`/listings/inventory${params}`),
  });
}

export function useMedicines(q?: string) {
  return useQuery({
    queryKey: ['medicines', q],
    queryFn: () => apiClient.get<PaginatedResponse<Medicine>>(`/medicines?q=${q ?? ''}&limit=20`),
    enabled: q !== undefined,
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

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { participantId: string; listingId?: string; orderId?: string }) =>
      apiClient.post<{ id: string }>('/chat/conversations', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; language?: string; theme?: string }) =>
      apiClient.patch<User>('/auth/me', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useCartCount() {
  const { data } = useCart();
  return data?.items?.length ?? 0;
}
