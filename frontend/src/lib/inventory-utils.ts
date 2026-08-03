import type { Listing } from '@/types';

const DEFAULT_LOW_STOCK_THRESHOLD = 20;

export type InventoryTab = 'ACTIVE' | 'PAUSED' | 'SOLD_OUT' | 'LOW_STOCK';

export interface InventoryStats {
  active: number;
  paused: number;
  soldOut: number;
  lowStock: number;
  total: number;
}

export function resolveLowStockThreshold(listing: Pick<Listing, 'availableQty' | 'moq' | 'lowStockThreshold'>): number {
  if (listing.lowStockThreshold != null) return listing.lowStockThreshold;
  return Math.max(listing.moq * 2, DEFAULT_LOW_STOCK_THRESHOLD);
}

export function isListingLowStock(listing: Listing): boolean {
  return listing.status === 'ACTIVE' && listing.availableQty <= resolveLowStockThreshold(listing);
}

export function buildInventoryQuery(tab: InventoryTab, search: string): string {
  const params = new URLSearchParams();
  if (tab === 'LOW_STOCK') {
    params.set('filter', 'low_stock');
    params.set('status', 'ACTIVE');
  } else {
    params.set('status', tab);
  }
  if (search.trim()) params.set('q', search.trim());
  params.set('limit', '100');
  return params.toString() ? `?${params}` : '';
}

export function inventoryExportFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `inventory-${date}.csv`;
}
