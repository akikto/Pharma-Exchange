import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/** Zustand-compatible async storage backed by IndexedDB. */
export const idbStorage: StateStorage = {
  getItem: async (name) => {
    const value = await get<string>(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

export const LOCAL_DB_KEYS = {
  recentSearches: 'pharmex-recent-searches',
  listingDraft: 'pharmex-listing-draft',
  watchlistCache: 'pharmex-cache-watchlist',
  priceAlertsCache: 'pharmex-cache-price-alerts',
  triggeredAlertsCache: 'pharmex-cache-triggered-alerts',
} as const;

export async function getLocalJson<T>(key: string): Promise<T | null> {
  const value = await get<T>(key);
  return value ?? null;
}

export async function setLocalJson<T>(key: string, value: T): Promise<void> {
  await set(key, value);
}

export async function removeLocalJson(key: string): Promise<void> {
  await del(key);
}

/** One-time migration from localStorage zustand keys to IndexedDB. */
export async function migrateLegacyLocalStorage(): Promise<void> {
  const legacyKeys = ['pharmex-recent-searches', 'pharmex-watchlist'];
  for (const key of legacyKeys) {
    const legacy = localStorage.getItem(key);
    if (!legacy) continue;
    const existing = await get(key);
    if (!existing) await set(key, legacy);
    localStorage.removeItem(key);
  }
}
