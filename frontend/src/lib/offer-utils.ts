/** Low-stock when available quantity is at or below this threshold (or 2× MOQ). */
export const LOW_STOCK_THRESHOLD = 20;

export function isLowStock(availableQty: number, moq: number): boolean {
  return availableQty <= Math.max(moq * 2, LOW_STOCK_THRESHOLD);
}

export function calculateSavings(price: number, bestPrice: number): number {
  if (bestPrice <= 0 || price <= bestPrice) return 0;
  return price - bestPrice;
}

export function formatSavingsPercent(price: number, bestPrice: number): number {
  if (bestPrice <= 0 || price <= bestPrice) return 0;
  return Math.round(((price - bestPrice) / price) * 100);
}

/** Deterministic pseudo-random from string seed (0–1). */
function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = `${seed}-${index}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

export interface PriceTrendPoint {
  date: string;
  price: number;
}

/** Simulated 30-day price history for demo chart. */
export function generatePriceTrend(medicineId: string, currentPrice: number): PriceTrendPoint[] {
  const points: PriceTrendPoint[] = [];
  const base = currentPrice * 1.12;
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const variance = (seededRandom(medicineId, i) - 0.5) * 0.08;
    const trend = (29 - i) / 29 * 0.12;
    const price = Math.max(currentPrice * 0.85, base * (1 - trend + variance));
    points.push({
      date: d.toISOString().slice(0, 10),
      price: Math.round(price * 100) / 100,
    });
  }
  points[points.length - 1]!.price = currentPrice;
  return points;
}

export function formatPhoneHref(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (trimmed.startsWith('+')) {
    return `tel:+${digits}`;
  }
  return `tel:+${digits.startsWith('880') ? digits : `880${digits.replace(/^0/, '')}`}`;
}

export function formatWhatsAppHref(phone?: string | null, message?: string): string | null {
  const tel = formatPhoneHref(phone);
  if (!tel) return null;
  const digits = tel.replace('tel:+', '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

export type CompareSort = 'price' | 'expiry' | 'distance';

export function sortCompareListings<T extends { finalPrice: string | number; expiryDate: string; distanceKm?: number | null }>(
  listings: T[],
  sortBy: CompareSort,
): T[] {
  return [...listings].sort((a, b) => {
    if (sortBy === 'expiry') {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
    if (sortBy === 'distance') {
      return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    }
    return Number(a.finalPrice) - Number(b.finalPrice);
  });
}
