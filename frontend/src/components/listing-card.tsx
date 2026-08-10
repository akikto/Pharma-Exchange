import { OfferCard } from '@/components/offers/offer-card';
import { isRenderableListing } from '@/lib/catalog-groups';
import { warnInvalidListing } from '@/lib/listing-debug';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  className?: string;
  showActions?: boolean;
  showAddToCart?: boolean;
  bestPrice?: number;
  variant?: 'grid' | 'list' | 'featured';
  userCoords?: { latitude: number; longitude: number } | null;
}

/** Grid marketplace card — delegates to OfferCard. */
export function ListingCard({
  listing,
  className,
  showActions = false,
  showAddToCart = false,
  bestPrice,
  variant = 'grid',
  userCoords,
}: ListingCardProps) {
  if (!isRenderableListing(listing)) {
    warnInvalidListing('listing-card:render', { listing });
    return null;
  }

  return (
    <div data-testid={`listing-card-${listing.id}`}>
      <OfferCard
        listing={listing}
        className={className}
        variant={variant}
        showActions={showActions}
        showAddToCart={showAddToCart}
        bestPrice={bestPrice}
        userCoords={userCoords}
      />
    </div>
  );
}
