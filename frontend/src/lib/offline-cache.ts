import { LOCAL_DB_KEYS, getLocalJson, setLocalJson } from '@/lib/local-db';
import type { PriceAlertEntry, TriggeredAlertEntry, WatchlistEntry } from '@/hooks/use-watchlist';

interface CachedPayload<T> {
  savedAt: string;
  data: T;
}

async function saveCache<T>(key: string, data: T): Promise<void> {
  await setLocalJson<CachedPayload<T>>(key, { savedAt: new Date().toISOString(), data });
}

async function loadCache<T>(key: string): Promise<T | null> {
  const cached = await getLocalJson<CachedPayload<T>>(key);
  return cached?.data ?? null;
}

export async function cacheWatchlist(data: { data: WatchlistEntry[] }): Promise<void> {
  await saveCache(LOCAL_DB_KEYS.watchlistCache, data);
}

export async function getCachedWatchlist(): Promise<{ data: WatchlistEntry[] } | null> {
  return loadCache(LOCAL_DB_KEYS.watchlistCache);
}

export async function cachePriceAlerts(data: { data: PriceAlertEntry[] }): Promise<void> {
  await saveCache(LOCAL_DB_KEYS.priceAlertsCache, data);
}

export async function getCachedPriceAlerts(): Promise<{ data: PriceAlertEntry[] } | null> {
  return loadCache(LOCAL_DB_KEYS.priceAlertsCache);
}

export async function cacheTriggeredAlerts(data: { data: TriggeredAlertEntry[] }): Promise<void> {
  await saveCache(LOCAL_DB_KEYS.triggeredAlertsCache, data);
}

export async function getCachedTriggeredAlerts(): Promise<{ data: TriggeredAlertEntry[] } | null> {
  return loadCache(LOCAL_DB_KEYS.triggeredAlertsCache);
}
