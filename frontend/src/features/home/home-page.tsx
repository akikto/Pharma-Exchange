import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Search, LayoutGrid, Layers, X, RefreshCw, Sparkles, Clock, LayoutList } from 'lucide-react';
import { HomeHeroStack } from '@/components/home/home-hero-stack';
import { HOME_GUTTER_CLASS } from '@/components/home/home-layout';
import { HomeAppBar } from '@/components/home/home-app-bar';
import { HomeSectionHeader } from '@/components/home/home-section-header';
import { ListingCard } from '@/components/listing-card';
import { ListingCardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiMatchSection } from '@/components/home/ai-match-section';
import { CatalogGroupCard } from '@/components/home/catalog-group-card';
import { ListingsEmptyState } from '@/components/home/listings-empty-state';
import { PullToRefreshIndicator } from '@/components/home/pull-to-refresh-indicator';
import { useListings } from '@/hooks/use-listings';
import { useDemoShops } from '@/hooks/use-pharmacy';
import { useInfiniteScroll } from '@/hooks/use-chat';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import {
  filterListingsByQuery,
  groupListingsByMedicine,
  isRenderableListing,
} from '@/lib/catalog-groups';
import {
  buildFeaturedDealsParams,
  resolveFeaturedDeals,
  resolveFeaturedShopFilter,
} from '@/lib/home-feed';
import { HOME_QUICK_FILTERS, homeFilterToParams, type HomeQuickFilter } from '@/lib/search-constants';
import { useDemoShopStore } from '@/stores/demo-shop-store';
import { useAuthStore } from '@/stores/auth-store';
import { useGeolocation } from '@/hooks/use-geolocation';
import { cn } from '@/lib/utils';

type FeedView = 'grid' | 'catalog';

export function HomePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<HomeQuickFilter>('filterAll');
  const [feedView, setFeedView] = useState<FeedView>('grid');
  const { coords, error: geoError, requestLocation } = useGeolocation();
  const activeShopId = useDemoShopStore((s) => s.activeShopId);
  const { data: demoShops } = useDemoShops();

  const listingParams = useMemo(() => {
    if (activeFilter === 'filterNearby' && !coords) {
      requestLocation();
    }
    return {
      ...homeFilterToParams(activeFilter, coords),
      ...(activeShopId ? { pharmacyId: activeShopId } : {}),
    };
  }, [activeFilter, coords, requestLocation, activeShopId]);

  const validatedShopId = useMemo(() => {
    const demoShopIds = demoShops?.map((shop) => shop.id) ?? [];
    return resolveFeaturedShopFilter(activeShopId, demoShopIds);
  }, [activeShopId, demoShops]);

  const shopFeaturedParams = useMemo(
    () => buildFeaturedDealsParams(validatedShopId),
    [validatedShopId],
  );
  const marketplaceFeaturedParams = useMemo(() => buildFeaturedDealsParams(), []);

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, isFetching, refetch } = useListings(listingParams);
  const { data: shopFeaturedData, isFetched: shopFeaturedFetched } = useListings(shopFeaturedParams, {
    enabled: validatedShopId !== null,
  });
  const shopFeaturedListings = shopFeaturedData?.pages.flatMap((page) => page.data) ?? [];
  const shouldFallbackToMarketplace = validatedShopId !== null && shopFeaturedFetched && shopFeaturedListings.length === 0;
  const { data: marketplaceFeaturedData } = useListings(marketplaceFeaturedParams, {
    enabled: validatedShopId === null || shouldFallbackToMarketplace,
  });
  const rawListings = (data?.pages.flatMap((p) => p.data) ?? []).filter(isRenderableListing);
  const totalFromApi = data?.pages[0]?.pagination.total;

  const listings = useMemo(() => filterListingsByQuery(rawListings, searchQuery), [rawListings, searchQuery]);
  const featured = useMemo(
    () => resolveFeaturedDeals(
      validatedShopId,
      shopFeaturedListings,
      marketplaceFeaturedData?.pages.flatMap((page) => page.data) ?? [],
    ),
    [validatedShopId, shopFeaturedListings, marketplaceFeaturedData],
  );

  const catalogGroups = useMemo(() => groupListingsByMedicine(listings), [listings]);

  const hasActiveFilters = activeFilter !== 'filterAll' || searchQuery.trim().length > 0;

  const resetFilters = () => {
    setActiveFilter('filterAll');
    setSearchQuery('');
  };

  const refreshFeed = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['listings'] });
    await qc.invalidateQueries({ queryKey: ['ai-matches'] });
    await refetch();
  }, [qc, refetch]);

  const { pullDistance, isRefreshing, isTriggered, runRefresh, handlers } = usePullToRefresh({
    onRefresh: refreshFeed,
  });

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const scrollRef = useInfiniteScroll(loadMore, !!hasNextPage);

  useEffect(() => {
    if (featured.length > 0 && !coords && !geoError) {
      requestLocation();
    }
  }, [featured.length, coords, geoError, requestLocation]);

  const shortExpiry = listings.filter((l) => {
    const months = (new Date(l.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    return months >= 1 && months <= 6;
  }).slice(0, 6);

  const resultCount = searchQuery.trim() ? listings.length : (totalFromApi ?? listings.length);

  return (
    <div {...handlers}>
      <HomeAppBar />

      <div className={cn('box-border w-full max-w-full pb-3 pt-2', HOME_GUTTER_CLASS)} data-testid="home-page-feed">
        <HomeHeroStack />

        <div className={cn('mt-2.5 flex flex-col gap-3')}>
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing || isFetching}
          isTriggered={isTriggered}
        />

        <div className="space-y-2" data-testid="home-inline-search">
          <div className="relative flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                className="h-11 rounded-full border-border-strong bg-surface-raised/90 pl-9 shadow-elevation-1 text-text-primary placeholder:text-text-disabled focus-visible:border-primary/40 focus-visible:ring-primary/20"
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
              className="h-11 w-11 shrink-0 rounded-full border-border-strong bg-surface-base shadow-elevation-1"
              aria-label={t('home.refreshFeed')}
              onClick={() => void runRefresh()}
            >
              <RefreshCw className={cn('h-4 w-4 text-text-secondary', (isRefreshing || isFetching) && 'animate-spin')} />
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="min-w-0 text-xs leading-5 text-text-secondary tabular-nums">
              {t('home.resultCount', { count: resultCount })}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary"
                  onClick={resetFilters}
                >
                  <X className="h-3.5 w-3.5" />
                  {t('home.clearFilters')}
                </button>
              )}
              <Link
                to={searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : '/search'}
                className="inline-flex items-center rounded-full border border-border-strong bg-surface-raised px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-sunken"
              >
                {t('home.fullSearch')}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" data-testid="home-quick-filters">
          {HOME_QUICK_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors',
                activeFilter === key
                  ? 'border-primary bg-primary text-white font-semibold shadow-elevation-1'
                  : 'border-border-subtle bg-surface-raised/80 text-text-secondary hover:bg-surface-sunken hover:border-border-strong',
              )}
              onClick={() => setActiveFilter(key)}
            >
              {t(`home.${key}`)}
            </button>
          ))}
        </div>

        <div className="flex w-full max-w-full gap-1 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised/60 p-1 shadow-elevation-1 sm:w-fit" data-testid="home-feed-view-toggle">
          <button
            type="button"
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm transition-colors sm:flex-none',
              feedView === 'grid'
                ? 'bg-surface-base font-medium text-primary shadow-elevation-1'
                : 'text-text-secondary hover:text-text-primary',
            )}
            onClick={() => setFeedView('grid')}
            data-testid="feed-view-grid"
          >
            <LayoutGrid className={cn('h-4 w-4', feedView === 'grid' ? 'text-primary' : 'text-text-secondary')} />
            {t('home.gridView')}
          </button>
          <button
            type="button"
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm transition-colors sm:flex-none',
              feedView === 'catalog'
                ? 'bg-surface-base font-medium text-primary shadow-elevation-1'
                : 'text-text-secondary hover:text-text-primary',
            )}
            onClick={() => setFeedView('catalog')}
            data-testid="feed-view-catalog"
          >
            <Layers className={cn('h-4 w-4', feedView === 'catalog' ? 'text-primary' : 'text-text-secondary')} />
            {t('home.catalogView')}
          </button>
        </div>

        {isAuthenticated && <AiMatchSection />}

        {feedView === 'catalog' ? (
          <section>
            <HomeSectionHeader
              title={t('home.catalogComparison')}
              subtitle={t('home.catalogComparisonSub')}
              icon={Layers}
            />
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
            ) : catalogGroups.length === 0 ? (
              <ListingsEmptyState onClearFilters={resetFilters} showClearFilters={hasActiveFilters} />
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
                <HomeSectionHeader
                  title={t('home.featuredDeals')}
                  subtitle={t('home.featuredDealsSub')}
                  icon={Sparkles}
                />
                <div className="flex gap-2.5 overflow-x-auto pb-2">
                  {featured.map((l) => (
                    <ListingCard
                      key={l.id}
                      listing={l}
                      variant="featured"
                      userCoords={coords}
                      showAddToCart
                      className="w-52 shrink-0"
                    />
                  ))}
                </div>
              </section>
            )}

            {shortExpiry.length > 0 && (
              <section>
                <HomeSectionHeader
                  title={t('home.shortExpiry')}
                  subtitle={t('home.shortExpirySub')}
                  icon={Clock}
                />
                <div className="grid grid-cols-2 gap-2.5" data-testid="home-short-expiry-grid">
                  {shortExpiry.map((l) => (
                    <ListingCard key={l.id} listing={l} showAddToCart className="min-w-0 w-full" />
                  ))}
                </div>
              </section>
            )}

            <section>
              <HomeSectionHeader
                title={t('home.allListings')}
                subtitle={t('home.allListingsSub')}
                icon={LayoutList}
              />
              {isLoading ? (
                <div className="grid grid-cols-2 gap-2.5">{Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
              ) : listings.length === 0 ? (
                <ListingsEmptyState onClearFilters={resetFilters} showClearFilters={hasActiveFilters} />
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {listings.map((l) => <ListingCard key={l.id} listing={l} showAddToCart />)}
                </div>
              )}
              <div ref={scrollRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  {Array.from({ length: 2 }).map((_, i) => <ListingCardSkeleton key={i} />)}
                </div>
              )}
            </section>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
