import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { ListingCard } from '@/components/listing-card';
import { ListingCardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useListings } from '@/hooks/use-listings';
import { useInfiniteScroll } from '@/hooks/use-chat';
import { useShellStore } from '@/stores/shell-store';

const filterKeys = ['filterAll', 'filterNearby', 'filterNew', 'filterDiscounted'] as const;

export function HomePage() {
  const { t } = useTranslation();
  const openModal = useShellStore((s) => s.openModal);
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
      <TopBar showLogo title={t('home.title')} large actions={
        <Button variant="ghost" size="icon" aria-label={t('search.modalTitle')} onClick={() => openModal('search')}>
          <Search className="h-5 w-5" />
        </Button>
      } />

      <div className="px-4 pb-4 space-y-6">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3 text-left"
          onClick={() => openModal('search')}
          data-testid="home-search-bar"
        >
          <Search className="h-4 w-4 text-text-secondary" />
          <span className="text-text-secondary text-sm">{t('home.searchPlaceholder')}</span>
        </button>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filterKeys.map((key) => (
            <button key={key} type="button" className="shrink-0 rounded-full border border-border-subtle px-4 py-1.5 text-sm hover:bg-primary-subtle hover:border-primary hover:text-primary">
              {t(`home.${key}`)}
            </button>
          ))}
        </div>

        {featured.length > 0 && (
          <section>
            <h2 className="font-semibold mb-1">{t('home.featuredDeals')}</h2>
            <p className="text-[10px] text-text-disabled mb-3">{t('home.featuredDealsSub')}</p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {featured.map((l) => <ListingCard key={l.id} listing={l} className="w-40 shrink-0" />)}
            </div>
          </section>
        )}

        {shortExpiry.length > 0 && (
          <section>
            <h2 className="font-semibold mb-1 flex items-center gap-2">⏰ {t('home.shortExpiry')}</h2>
            <p className="text-[10px] text-text-disabled mb-3">{t('home.shortExpirySub')}</p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {shortExpiry.map((l) => <ListingCard key={l.id} listing={l} className="w-40 shrink-0" />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-semibold mb-1">{t('home.allListings')}</h2>
          <p className="text-[10px] text-text-disabled mb-3">{t('home.allListingsSub')}</p>
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
