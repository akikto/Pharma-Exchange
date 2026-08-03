/** Therapeutic category chips mapped to API `category` contains filter. */
export const THERAPEUTIC_CATEGORIES = [
  { key: 'gastric', value: 'Gastro' },
  { key: 'pain', value: 'Analgesic' },
  { key: 'antibiotic', value: 'Antibiotic' },
  { key: 'cardio', value: 'Cardio' },
  { key: 'respiratory', value: 'Respiratory' },
  { key: 'vitamin', value: 'Vitamin' },
] as const;

/** Dosage form chips mapped to Prisma `DosageForm` enum. */
export const DOSAGE_FORMS = [
  { key: 'tablet', value: 'TABLET' },
  { key: 'capsule', value: 'CAPSULE' },
  { key: 'syrup', value: 'SYRUP' },
  { key: 'injection', value: 'INJECTION' },
  { key: 'chewable', value: 'TABLET' },
] as const;

export const SORT_OPTIONS = [
  { value: 'recommended', order: 'desc' },
  { value: 'price', order: 'asc' },
  { value: 'price', order: 'desc' },
  { value: 'rating', order: 'desc' },
  { value: 'distance', order: 'asc' },
  { value: 'createdAt', order: 'desc' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export const VOICE_SEARCH_DEMO_QUERY = 'Paracetamol';

export const HOME_QUICK_FILTERS = [
  'filterAll',
  'filterNearby',
  'filterShortExpiry',
  'filterBigDiscount',
  'filterOverstock',
] as const;

export type HomeQuickFilter = (typeof HOME_QUICK_FILTERS)[number];

export function homeFilterToParams(
  filter: HomeQuickFilter,
  coords?: { latitude: number; longitude: number } | null,
): Record<string, string | undefined> {
  switch (filter) {
    case 'filterNearby':
      return coords
        ? { latitude: String(coords.latitude), longitude: String(coords.longitude), radiusKm: '2' }
        : {};
    case 'filterShortExpiry':
      return { maxExpiryDays: '30' };
    case 'filterBigDiscount':
      return { minDiscount: '50', sortBy: 'discount', sortOrder: 'desc' };
    case 'filterOverstock':
      return { minAvailableQty: '50' };
    default:
      return { sortBy: 'recommended', sortOrder: 'desc' };
  }
}
