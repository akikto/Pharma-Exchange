import { OfferCard } from '@/components/offers/offer-card';
import { isRenderableListing } from '@/lib/catalog-groups';
import { warnInvalidListing } from '@/lib/listing-debug';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  className?: string;
  showActions?: boolean;
  bestPrice?: number;
}

/** Grid marketplace card — delegates to OfferCard. */
export function ListingCard({ listing, className, showActions = false, bestPrice }: ListingCardProps) {
  if (!isRenderableListing(listing)) {
    warnInvalidListing('listing-card:render', { listing });
    return null;
  }

  return (
    <div data-testid={`listing-card-${listing.id}`}>
      <OfferCard
        listing={listing}
        className={className}
        variant="grid"
        showActions={showActions}
        bestPrice={bestPrice}
      />
    </div>
  );
}
