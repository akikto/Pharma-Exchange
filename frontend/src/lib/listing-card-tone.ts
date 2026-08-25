import { getExpiryStatus, cn } from '@/lib/utils';
import { isLowStock } from '@/lib/offer-utils';
import type { Listing } from '@/types';

/** Semantic listing card accents — four tones aligned with the design system. */
export type ListingCardTone = 'default' | 'featured' | 'warning' | 'danger';

export function resolveListingCardTone(
  listing: Listing,
  explicit?: ListingCardTone,
): ListingCardTone {
  if (explicit) return explicit;
  const expiryStatus = getExpiryStatus(listing.expiryDate);
  if (expiryStatus === 'danger') return 'danger';
  if (expiryStatus === 'warning' || isLowStock(listing.availableQty, listing.moq)) return 'warning';
  return 'default';
}

export function listingCardToneClasses(tone: ListingCardTone): string {
  return cn(
    'border',
    tone === 'default' && 'border-border-subtle bg-surface-base',
    tone === 'featured' && 'border-primary/35 bg-primary-subtle/25',
    tone === 'warning' && 'border-warning/40 bg-surface-base',
    tone === 'danger' && 'border-danger/45 bg-surface-base',
  );
}

/** Shared shell for catalog / grouped cards (same radius, elevation, tones). */
export function marketplaceCardShellClasses(tone: ListingCardTone = 'default', interactive = false): string {
  return cn(
    'rounded-[var(--radius-md)] overflow-hidden shadow-elevation-1',
    listingCardToneClasses(tone),
    interactive && 'listing-card-interactive transition-[transform,box-shadow] duration-200 ease-out',
  );
}
