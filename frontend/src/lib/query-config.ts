/** TanStack Query stale times — listings use longer SWR window. */
export const QUERY_STALE_TIMES = {
  listings: 5 * 60_000,
  cart: 30_000,
  orders: 60_000,
  notifications: 60_000,
  buyRequests: 60_000,
  default: 30_000,
} as const;
