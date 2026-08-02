import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { ListingCard } from '@/components/listing-card';
import { ListingCardSkeleton } from '@/components/ui/skeleton';
import { useListings } from '@/hooks/use-listings';
import { useInfiniteScroll } from '@/hooks/use-chat';

const quickFilters = ['All', 'Nearby', 'New', 'Discounted'];

export function HomePage() {
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useListings({ sortBy: 'createdAt' });
  const listings = data?.pages.flatMap((p) => p.data) ?? [];

  const loadMore = useCallback(() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const scrollRef = useInfiniteScroll(loadMore, !!hasNextPage);

  const featured = listings.filter((l) => l.discountPercent > 0).slice(0, 6);
  const shortExpiry = listings.filter((l) => {
    const months = (new Date(l.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    return months >= 1 && months <= 6;
  }).slice(0, 6);

  return (
    <div>
      <TopBar showLogo title="Home" large actions={
        <Link to="/search" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-raised">
          <Search className="h-5 w-5" />
        </Link>
      } />

      <div className="px-4 pb-4 space-y-6">
        <Link to="/search" className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3">
          <Search className="h-4 w-4 text-text-secondary" />
          <span className="text-text-secondary text-sm">Search medicines, brands...</span>
        </Link>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {quickFilters.map((f) => (
            <button key={f} className="shrink-0 rounded-full border border-border-subtle px-4 py-1.5 text-sm hover:bg-primary-subtle hover:border-primary hover:text-primary">
              {f}
            </button>
          ))}
        </div>

        {featured.length > 0 && (
          <section>
            <h2 className="font-semibold mb-3">Featured Deals</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {featured.map((l) => <ListingCard key={l.id} listing={l} className="w-40 shrink-0" />)}
            </div>
          </section>
        )}

        {shortExpiry.length > 0 && (
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2">⏰ Short Expiry Deals</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {shortExpiry.map((l) => <ListingCard key={l.id} listing={l} className="w-40 shrink-0" />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-semibold mb-3">All Listings</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
          {isFetchingNextPage && <div className="grid grid-cols-2 gap-3 mt-3">{Array.from({ length: 2 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>}
        </section>
      </div>
    </div>
  );
}
