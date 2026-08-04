import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, GitCompare, Bell, TrendingDown, TrendingUp, Minus, ShoppingCart, X, Zap } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  useWatchlist,
  useToggleWatchlist,
  usePriceAlerts,
  useUpsertPriceAlert,
  useUpdatePriceAlert,
  useTriggeredAlerts,
  useDismissTriggeredAlert,
  useSimulatePriceAlert,
  type WatchlistEntry,
} from '@/hooks/use-watchlist';
import { useAddToCart } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { trendLabel } from '@/lib/watchlist-utils';

type Tab = 'watchlist' | 'alerts';

export function WatchlistPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('watchlist');
  const { data, isLoading, isError } = useWatchlist();
  const { data: triggered } = useTriggeredAlerts();
  const alertCount = triggered?.data.length ?? 0;

  return (
    <div>
      <TopBar title={t('watchlist.title')} showBack />
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('watchlist')}
            className={`flex-1 rounded-full py-2 text-sm font-medium border ${
              tab === 'watchlist' ? 'bg-primary text-on-primary border-primary' : 'border-border-subtle'
            }`}
          >
            {t('watchlist.tabList')}
          </button>
          <button
            type="button"
            onClick={() => setTab('alerts')}
            className={`flex-1 rounded-full py-2 text-sm font-medium border relative ${
              tab === 'alerts' ? 'bg-primary text-on-primary border-primary' : 'border-border-subtle'
            }`}
          >
            {t('watchlist.tabAlerts')}
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-danger text-white text-[10px] flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </button>
        </div>

        {tab === 'watchlist' ? (
          isLoading ? <ListSkeleton /> : isError ? (
            <p className="text-center text-danger py-12">{t('watchlist.loadError')}</p>
          ) : (data?.data.length ?? 0) === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-10 w-10 mx-auto text-text-disabled mb-3" />
              <p className="text-text-secondary">{t('watchlist.empty')}</p>
              <Link to="/search"><Button className="mt-4">{t('watchlist.browse')}</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.data.filter((item) => item?.id).map((item) => <WatchlistRow key={item.id} item={item} />)}
            </div>
          )
        ) : (
          <AlertsPanel />
        )}
      </div>
    </div>
  );
}

function WatchlistRow({ item }: { item: WatchlistEntry }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const toggle = useToggleWatchlist();
  const upsertAlert = useUpsertPriceAlert();
  const simulate = useSimulatePriceAlert();
  const [maxPrice, setMaxPrice] = useState(item.bestPrice ? String(item.bestPrice) : '');

  const TrendIcon = item.priceTrend === 'DOWN' ? TrendingDown : item.priceTrend === 'UP' ? TrendingUp : Minus;

  const handleRemove = () => {
    toggle.mutate(item.medicineId, {
      onSuccess: (r) => toast({ description: r.added === false ? t('search.removedWatchlist') : t('search.addedWatchlist') }),
    });
  };

  const handleSetAlert = async () => {
    const price = Number(maxPrice);
    if (!price || price <= 0) return;
    try {
      await upsertAlert.mutateAsync({ medicineId: item.medicineId, maxPrice: price });
      toast({ description: t('watchlist.alertSet') });
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleSimulate = async () => {
    const price = Number(maxPrice) || Number(item.bestPrice) || 10;
    try {
      await upsertAlert.mutateAsync({ medicineId: item.medicineId, maxPrice: price });
      await simulate.mutateAsync({ medicineId: item.medicineId, listingPrice: price * 0.8 });
      toast({ description: t('watchlist.simulateSuccess') });
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <Card data-testid={`watchlist-row-${item.medicineId}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-3">
          <div className="h-14 w-14 rounded bg-surface-sunken flex items-center justify-center shrink-0">💊</div>
          <div className="flex-1 min-w-0">
            <Link to={`/medicine/${item.medicineId}/compare`} className="font-medium text-sm truncate block hover:text-primary">
              {item.medicine?.name ?? '—'}
            </Link>
            <p className="text-xs text-text-secondary">{item.medicine?.company ?? ''}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {item.bestPrice != null ? (
                <span className="text-sm font-semibold tabular-nums">{formatPrice(item.bestPrice)}</span>
              ) : (
                <span className="text-xs text-text-secondary">{t('watchlist.noOffers')}</span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] text-text-secondary">
                <TrendIcon className="h-3 w-3" />
                {t(`watchlist.trend.${trendLabel(item.priceTrend)}`)}
              </span>
              <span className="text-[10px] text-text-secondary">
                {t('watchlist.sellers', { count: item.sellerCount })}
              </span>
            </div>
          </div>
          <button type="button" onClick={handleRemove} className="p-1 text-danger" aria-label={t('watchlist.remove')}>
            <Heart className="h-5 w-5 fill-current" />
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link to={`/medicine/${item.medicineId}/compare`}>
            <Button size="sm" variant="secondary"><GitCompare className="h-3.5 w-3.5" /> {t('watchlist.compare')}</Button>
          </Link>
          {item.bestListingId && (
            <AddToCartButton listingId={item.bestListingId} moq={1} />
          )}
        </div>

        <div className="flex gap-2 items-end pt-2 border-t border-border-subtle">
          <div className="flex-1">
            <label className="text-[10px] text-text-secondary">{t('watchlist.maxPrice')}</label>
            <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="৳" />
          </div>
          <Button size="sm" variant="secondary" onClick={handleSetAlert}><Bell className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="tertiary" onClick={handleSimulate} title={t('watchlist.simulate')}><Zap className="h-3.5 w-3.5" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AddToCartButton({ listingId, moq }: { listingId: string; moq: number }) {
  const { t } = useTranslation();
  const addToCart = useAddToCart();
  const { toast } = useToast();

  return (
    <Button
      size="sm"
      onClick={() => addToCart.mutate(
        { listingId, quantity: moq },
        {
          onSuccess: () => toast({ description: t('search.addedToCart') }),
          onError: (e) => toast({ title: t('toast.error'), description: e.message, variant: 'destructive' }),
        },
      )}
    >
      <ShoppingCart className="h-3.5 w-3.5" /> {t('watchlist.addToCart')}
    </Button>
  );
}

function AlertsPanel() {
  const { t } = useTranslation();
  const { data: alerts, isLoading: alertsLoading } = usePriceAlerts();
  const { data: triggered, isLoading: triggeredLoading } = useTriggeredAlerts();
  const updateAlert = useUpdatePriceAlert();
  const dismiss = useDismissTriggeredAlert();
  const addToCart = useAddToCart();
  const { toast } = useToast();

  if (alertsLoading || triggeredLoading) return <ListSkeleton />;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-semibold text-sm mb-3">{t('watchlist.activeAlerts')}</h2>
        {(alerts?.data.length ?? 0) === 0 ? (
          <p className="text-sm text-text-secondary">{t('watchlist.noAlerts')}</p>
        ) : (
          <div className="space-y-2">
            {alerts?.data.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-border-subtle">
                <div>
                  <p className="text-sm font-medium">{alert.medicine?.name ?? '—'}</p>
                  <p className="text-xs text-text-secondary">{t('watchlist.maxPrice')}: {formatPrice(alert.maxPrice)}</p>
                </div>
                <Button
                  size="sm"
                  variant={alert.isEnabled ? 'secondary' : 'tertiary'}
                  onClick={() => updateAlert.mutate({ id: alert.id, isEnabled: !alert.isEnabled })}
                >
                  {alert.isEnabled ? t('watchlist.enabled') : t('watchlist.disabled')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-sm mb-3">{t('watchlist.triggeredInbox')}</h2>
        {(triggered?.data.length ?? 0) === 0 ? (
          <p className="text-sm text-text-secondary">{t('watchlist.noTriggered')}</p>
        ) : (
          <div className="space-y-2">
            {triggered?.data.map((alert) => (
              <div key={alert.id} className="p-3 rounded-[var(--radius-md)] border border-primary/30 bg-primary-subtle/30">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{alert.medicine?.name ?? '—'}</p>
                    <p className="text-xs text-text-secondary">
                      {formatPrice(alert.listingPrice)} ≤ {formatPrice(alert.maxPrice)}
                      {alert.isSimulated && ` · ${t('watchlist.simulated')}`}
                    </p>
                  </div>
                  <button type="button" onClick={() => dismiss.mutate(alert.id)} aria-label={t('watchlist.dismiss')}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {alert.listingId && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => addToCart.mutate(
                      { listingId: alert.listingId!, quantity: alert.listing?.moq ?? 1 },
                      { onSuccess: () => toast({ description: t('search.addedToCart') }) },
                    )}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> {t('watchlist.addToCart')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
