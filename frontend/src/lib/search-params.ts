const ADVANCED_FILTER_KEYS = [
  'maxPrice',
  'minRating',
  'radiusKm',
  'verifiedOnly',
  'inStockOnly',
  'city',
  'minDiscount',
] as const;

const CHIP_FILTER_KEYS = ['category', 'dosageForm'] as const;

export type ListingSearchParams = Record<string, string | undefined>;

export function paramsFromSearchParams(sp: URLSearchParams): ListingSearchParams {
  const keys = [
    'q', 'category', 'dosageForm', 'city', 'minDiscount', 'maxPrice', 'minRating',
    'radiusKm', 'verifiedOnly', 'inStockOnly', 'sortBy', 'sortOrder',
    'latitude', 'longitude', 'maxExpiryDays', 'minAvailableQty',
  ];
  const result: ListingSearchParams = {};
  for (const key of keys) {
    const val = sp.get(key);
    if (val) result[key] = val;
  }
  if (!result.sortBy) result.sortBy = 'recommended';
  if (!result.sortOrder) result.sortOrder = 'desc';
  return result;
}

export function countActiveFilters(sp: URLSearchParams): number {
  let count = 0;
  for (const key of [...ADVANCED_FILTER_KEYS, ...CHIP_FILTER_KEYS]) {
    if (sp.get(key)) count += 1;
  }
  if (sp.get('maxExpiryDays')) count += 1;
  if (sp.get('minAvailableQty')) count += 1;
  return count;
}

export function clearAllFilters(sp: URLSearchParams): URLSearchParams {
  const q = sp.get('q');
  const next = new URLSearchParams();
  if (q) next.set('q', q);
  next.set('sortBy', 'recommended');
  next.set('sortOrder', 'desc');
  return next;
}

export function setParam(sp: URLSearchParams, key: string, value?: string): URLSearchParams {
  const next = new URLSearchParams(sp);
  if (value) next.set(key, value);
  else next.delete(key);
  return next;
}

export function toggleParam(sp: URLSearchParams, key: string, value: string): URLSearchParams {
  const next = new URLSearchParams(sp);
  if (next.get(key) === value) next.delete(key);
  else next.set(key, value);
  return next;
}
