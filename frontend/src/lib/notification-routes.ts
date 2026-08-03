/** Map notification payload data to in-app routes (deep links). */
export function getNotificationRoute(data?: Record<string, string>): string | null {
  if (!data) return null;
  if (data.orderId) return `/orders/${data.orderId}`;
  if (data.conversationId) return `/chat/${data.conversationId}`;
  if (data.buyRequestId) return `/buy-requests/${data.buyRequestId}`;
  if (data.listingId) return `/medicine/${data.listingId}`;
  if (data.pharmacyId) return `/pharmacy/${data.pharmacyId}`;
  return null;
}
