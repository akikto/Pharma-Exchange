import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { debugListingAction, warnInvalidListing } from '@/lib/listing-debug';
import type { CartItemIssue } from '@/lib/cart-validation';
import type { CartItem, PaginatedResponse, Order, BuyRequest, Notification, SellerAnalytics, Listing, Medicine } from '@/types';
import type { OrderPaymentRecord } from '@/lib/payments-api';

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.get<{
      items: CartItem[];
      groupedBySeller: Record<string, CartItem[]>;
      validationIssues?: CartItemIssue[];
    }>('/cart'),
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  const [loadingIds, setLoadingIds] = useState(() => new Set<string>());

  const addLoading = useCallback((listingId: string) => {
    setLoadingIds((prev) => {
      if (prev.has(listingId)) return prev;
      const next = new Set(prev);
      next.add(listingId);
      return next;
    });
  }, []);

  const removeLoading = useCallback((listingId: string) => {
    setLoadingIds((prev) => {
      if (!prev.has(listingId)) return prev;
      const next = new Set(prev);
      next.delete(listingId);
      return next;
    });
  }, []);

  const mutation = useMutation({
    mutationFn: (data: { listingId: string; quantity: number }) => apiClient.post('/cart', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
    onSettled: (_data, _error, variables) => {
      if (variables?.listingId) removeLoading(variables.listingId);
    },
  });

  const mutate = useCallback(
    (data: { listingId: string; quantity: number }, options?: Parameters<typeof mutation.mutate>[1]) => {
      debugListingAction('add-to-cart:mutate', { data, hasListingId: Boolean(data?.listingId) });
      if (!data?.listingId) {
        warnInvalidListing('add-to-cart:mutate', { data });
        return;
      }
      addLoading(data.listingId);
      mutation.mutate(data, options);
    },
    [mutation, addLoading],
  );

  const mutateAsync = useCallback(
    (data: { listingId: string; quantity: number }, options?: Parameters<typeof mutation.mutateAsync>[1]) => {
      debugListingAction('add-to-cart:mutateAsync', { data, hasListingId: Boolean(data?.listingId) });
      if (!data?.listingId) {
        warnInvalidListing('add-to-cart:mutateAsync', { data });
        return Promise.reject(new Error('Listing unavailable'));
      }
      addLoading(data.listingId);
      return mutation.mutateAsync(data, options);
    },
    [mutation, addLoading],
  );

  const isAddingToCart = useCallback(
    (listingId?: string) => Boolean(listingId && loadingIds.has(listingId)),
    [loadingIds],
  );

  return {
    ...mutation,
    mutate,
    mutateAsync,
    isAddingToCart,
  };
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

export function useOrderPayments(orderId?: string) {
  return useQuery({
    queryKey: ['order-payments', orderId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: OrderPaymentRecord[] }>(`/payments/order/${orderId}`);
      return res.data;
    },
    enabled: !!orderId,
  });
}

export function useSetOrderPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, method }: { orderId: string; method: 'COD' | 'RAZORPAY' }) =>
      apiClient.patch<Order>(`/orders/${orderId}/payment-method`, { method }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['order', variables.orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useBuyRequests(role: 'buyer' | 'seller' = 'buyer', options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['buy-requests', role],
    queryFn: () => apiClient.get<PaginatedResponse<BuyRequest>>(`/buy-requests?role=${role}`),
    enabled: options?.enabled ?? true,
  });
}

export function useBuyRequest(id?: string) {
  return useQuery({
    queryKey: ['buy-request', id],
    queryFn: () => apiClient.get<BuyRequest>(`/buy-requests/${id}`),
    enabled: !!id,
  });
}

export function useSellerInventory(tab?: string, search?: string) {
  const params = new URLSearchParams();
  if (tab === 'LOW_STOCK') {
    params.set('filter', 'low_stock');
    params.set('status', 'ACTIVE');
  } else if (tab) {
    params.set('status', tab);
  }
  if (search?.trim()) params.set('q', search.trim());
  params.set('limit', '100');
  const qs = params.toString();
  return useQuery({
    queryKey: ['seller-inventory', tab, search],
    queryFn: () => apiClient.get<PaginatedResponse<Listing>>(`/listings/inventory${qs ? `?${qs}` : ''}`),
  });
}

export function useInventoryStats() {
  return useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => apiClient.get<{ active: number; paused: number; soldOut: number; lowStock: number; total: number }>('/listings/inventory/stats'),
  });
}

function invalidateInventory(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['seller-inventory'] });
  qc.invalidateQueries({ queryKey: ['inventory-stats'] });
}

export function usePauseListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/listings/${id}/pause`),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useActivateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/listings/${id}/activate`),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useMarkSoldOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/listings/${id}/sold-out`),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/listings/${id}`),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useRestockListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount = 50 }: { id: string; amount?: number }) =>
      apiClient.post(`/listings/${id}/restock`, { amount }),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useUpdateListingPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sellingPrice, discountPercent }: { id: string; sellingPrice?: number; discountPercent?: number }) =>
      apiClient.patch<Listing>(`/listings/${id}/price`, { sellingPrice, discountPercent }),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useUpdateListingQuantity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, availableQty }: { id: string; availableQty: number }) =>
      apiClient.patch<Listing>(`/listings/${id}/quantity`, { availableQty }),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useExportInventory() {
  return useMutation({
    mutationFn: () => apiClient.getText('/listings/inventory/export'),
  });
}

export interface BulkRequest {
  id: string;
  requestNumber: string;
  quantity: number;
  targetPrice: string | number;
  urgency: string;
  status: string;
  listingId?: string;
  listing?: { id: string; status: string; availableQty: number; finalPrice: string | number };
  medicine: { id: string; name: string; company: string };
}

export function useBulkRequests() {
  return useQuery({
    queryKey: ['bulk-requests'],
    queryFn: () => apiClient.get<PaginatedResponse<BulkRequest>>('/bulk-requests'),
  });
}

export function useCreateBulkRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => apiClient.post<BulkRequest>('/bulk-requests', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bulk-requests'] });
      qc.invalidateQueries({ queryKey: ['seller-inventory'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
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

export function useSellerAnalytics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['analytics', 'seller'],
    queryFn: () => apiClient.get<SellerAnalytics>('/analytics/seller'),
    enabled: options?.enabled ?? true,
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { participantId: string; listingId?: string; orderId?: string; buyRequestId?: string }) =>
      apiClient.post<{ id: string }>('/chat/conversations', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}
