import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Search, LayoutGrid, Layers, X, RefreshCw } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { ListingCard } from '@/components/listing-card';
import { ListingCardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShopHeader } from '@/components/home/shop-header';
import { HomeHeaderActions } from '@/components/home/home-header-actions';
import { BulkProcurementBanner } from '@/components/home/bulk-procurement-banner';
import { CatalogGroupCard } from '@/components/home/catalog-group-card';
import { PullToRefreshIndicator } from '@/components/home/pull-to-refresh-indicator';
import { useListings } from '@/hooks/use-listings';
import { useInfiniteScroll } from '@/hooks/use-chat';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import {
  filterListingsByQuery,
  groupListingsByMedicine,
} from '@/lib/catalog-groups';
import { HOME_QUICK_FILTERS, homeFilterToParams, type HomeQuickFilter } from '@/lib/search-constants';
import { useGeolocation } from '@/hooks/use-geolocation';
import { cn } from '@/lib/utils';

type FeedView = 'grid' | 'catalog';

export function HomePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<HomeQuickFilter>('filterAll');
  const [feedView, setFeedView] = useState<FeedView>('grid');
  const { coords, requestLocation } = useGeolocation();

  const listingParams = useMemo(() => {
    if (activeFilter === 'filterNearby' && !coords) {
      requestLocation();
    }
    return homeFilterToParams(activeFilter, coords);
  }, [activeFilter, coords, requestLocation]);

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, isFetching, refetch } = useListings(listingParams);
  const rawListings = data?.pages.flatMap((p) => p.data) ?? [];
  const totalFromApi = data?.pages[0]?.pagination.total;

  const listings = useMemo(() => filterListingsByQuery(rawListings, searchQuery), [rawListings, searchQuery]);

  const catalogGroups = useMemo(() => groupListingsByMedicine(listings), [listings]);

  const hasActiveFilters = activeFilter !== 'filterAll' || searchQuery.trim().length > 0;

  const resetFilters = () => {
    setActiveFilter('filterAll');
    setSearchQuery('');
  };

  const refreshFeed = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['listings'] });
    await refetch();
  }, [qc, refetch]);

  const { pullDistance, isRefreshing, isTriggered, runRefresh, handlers } = usePullToRefresh({
    onRefresh: refreshFeed,
  });

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const scrollRef = useInfiniteScroll(loadMore, !!hasNextPage);

  const featured = listings.filter((l) => l.discountPercent > 0).slice(0, 6);
  const shortExpiry = listings.filter((l) => {
    const months = (new Date(l.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    return months >= 1 && months <= 6;
  }).slice(0, 6);

  const resultCount = searchQuery.trim() ? listings.length : (totalFromApi ?? listings.length);

  return (
    <div {...handlers}>
      <TopBar showLogo title={t('home.title')} large actions={<HomeHeaderActions />} />

      <BulkProcurementBanner />

      <div className="px-4 pb-4 space-y-4">
        <ShopHeader />

        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing || isFetching}
          isTriggered={isTriggered}
        />

        <div className="space-y-2" data-testid="home-inline-search">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                className="pl-9"
                placeholder={t('home.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t('home.searchPlaceholder')}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={t('home.refreshFeed')}
              onClick={() => void runRefresh()}
            >
              <RefreshCw className={cn('h-4 w-4', (isRefreshing || isFetching) && 'animate-spin')} />
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{t('home.resultCount', { count: resultCount })}</span>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button type="button" className="text-primary flex items-center gap-1" onClick={resetFilters}>
                  <X className="h-3 w-3" />
                  {t('home.clearFilters')}
                </button>
              )}
              <Link to={searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : '/search'} className="text-primary">
                {t('home.fullSearch')}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" data-testid="home-quick-filters">
          {HOME_QUICK_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors',
                activeFilter === key
                  ? 'border-primary bg-primary-subtle text-primary font-medium'
                  : 'border-border-subtle hover:bg-primary-subtle hover:border-primary hover:text-primary',
              )}
              onClick={() => setActiveFilter(key)}
            >
              {t(`home.${key}`)}
            </button>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-surface-sunken rounded-[var(--radius-md)] w-fit">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
              feedView === 'grid' && 'bg-surface-base shadow-sm font-medium',
            )}
            onClick={() => setFeedView('grid')}
            data-testid="feed-view-grid"
          >
            <LayoutGrid className="h-4 w-4" />
            {t('home.gridView')}
          </button>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
              feedView === 'catalog' && 'bg-surface-base shadow-sm font-medium',
            )}
            onClick={() => setFeedView('catalog')}
            data-testid="feed-view-catalog"
          >
            <Layers className="h-4 w-4" />
            {t('home.catalogView')}
          </button>
        </div>

        {feedView === 'catalog' ? (
          <section>
            <h2 className="font-semibold mb-1">{t('home.catalogComparison')}</h2>
            <p className="text-[10px] text-text-disabled mb-3">{t('home.catalogComparisonSub')}</p>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
            ) : catalogGroups.length === 0 ? (
              <p className="text-center text-text-secondary py-8">{t('search.noResults')}</p>
            ) : (
              <div className="space-y-3">
                {catalogGroups.map((g) => (
                  <CatalogGroupCard key={g.medicineId} group={g} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
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
              ) : listings.length === 0 ? (
                <p className="text-center text-text-secondary py-8">{t('search.noResults')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
              )}
              <div ref={scrollRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {Array.from({ length: 2 }).map((_, i) => <ListingCardSkeleton key={i} />)}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
