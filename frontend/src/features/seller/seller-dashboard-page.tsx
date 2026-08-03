import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Package, Inbox, TrendingUp, AlertTriangle } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useSellerAnalytics, useBuyRequests, useSellerInventory } from '@/hooks/use-api';
import { formatPrice } from '@/lib/utils';
import { useShellStore } from '@/stores/shell-store';

export function SellerDashboardPage() {
  const { t } = useTranslation();
  const openModal = useShellStore((s) => s.openModal);
  const { data: analytics, isLoading, isError } = useSellerAnalytics();
  const { data: requests } = useBuyRequests('seller');

  if (isLoading) return <div className="p-4"><ListSkeleton count={3} /></div>;
  if (isError) return <div className="p-4 text-center text-danger">{t('common.error')}</div>;

  return (
    <div>
      <TopBar showLogo title={t('seller.title')} />
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">{t('seller.sales30d')}</p><p className="text-lg font-bold tabular-nums">{formatPrice(analytics?.todaySales ?? 0)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">{t('seller.pendingRequests')}</p><p className="text-lg font-bold">{analytics?.pendingBuyRequests ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">{t('seller.activeListings')}</p><p className="text-lg font-bold">{analytics?.activeListings ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">{t('seller.rating')}</p><p className="text-lg font-bold">⭐ {analytics?.rating?.toFixed(1) ?? '0'}</p></CardContent></Card>
        </div>

        {(analytics?.shortExpiryAlert ?? 0) > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div className="flex-1"><p className="text-sm font-medium">{t('seller.expiringSoon', { count: analytics?.shortExpiryAlert })}</p></div>
            <Link to="/seller/inventory"><Button size="sm" variant="secondary">{t('seller.viewInventory')}</Button></Link>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{t('seller.pendingBuyRequests')}</h2>
            <Link to="/seller/requests" className="text-sm text-primary">{t('common.viewAll')}</Link>
          </div>
          {requests?.data.length === 0 ? (
            <p className="text-sm text-text-secondary">{t('seller.noPending')}</p>
          ) : (
            requests?.data.slice(0, 3).map((req) => (
              <Link key={req.id} to={`/seller/requests/${req.id}`} className="block p-3 mb-2 rounded-[var(--radius-md)] border border-border-subtle">
                <div className="flex justify-between"><span className="font-medium text-sm">{req.requestNumber}</span><StatusChip label={req.status} variant="warning" /></div>
                <p className="text-sm text-text-secondary mt-1">{formatPrice(req.totalAmount)} · {t('common.items', { count: req.items.length })}</p>
              </Link>
            ))
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/seller/listing/new"><Button className="w-full" size="lg"><Plus className="h-4 w-4" /> {t('seller.addListing')}</Button></Link>
          <Link to="/seller/inventory"><Button variant="secondary" className="w-full" size="lg"><Package className="h-4 w-4" /> {t('seller.inventory')}</Button></Link>
          <Link to="/seller/orders"><Button variant="secondary" className="w-full"><Inbox className="h-4 w-4" /> {t('seller.orders')}</Button></Link>
          <Link to="/seller/analytics"><Button variant="secondary" className="w-full"><TrendingUp className="h-4 w-4" /> {t('seller.analytics')}</Button></Link>
          <Button variant="tertiary" className="col-span-2" onClick={() => openModal('bulk')}>{t('modal.bulkTitle')}</Button>
        </div>
      </div>
    </div>
  );
}

export function SellerInventoryPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useSellerInventory();
  const listings = data?.data ?? [];
  const openModal = useShellStore((s) => s.openModal);

  return (
    <div>
      <TopBar title={t('seller.inventoryTitle')} showBack actions={<Link to="/seller/listing/new"><Button size="sm"><Plus className="h-4 w-4" /></Button></Link>} />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : isError ? (
          <p className="text-center text-danger py-12">{t('seller.loadError')}</p>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">{t('seller.noListings')}</p>
            <Link to="/seller/listing/new"><Button className="mt-4">{t('seller.addFirst')}</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <button
                key={l.id}
                type="button"
                className="flex w-full gap-3 p-3 rounded-[var(--radius-md)] border border-border-subtle text-left hover:bg-surface-raised"
                onClick={() => openModal('listingEdit', { listingId: l.id })}
              >
                <div className="h-14 w-14 rounded bg-surface-sunken flex items-center justify-center">💊</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{l.medicine.name}</p>
                  <p className="text-xs text-text-secondary">{formatPrice(l.finalPrice)} · Qty {l.availableQty}</p>
                  <StatusChip label={l.status} variant={l.status === 'ACTIVE' ? 'success' : 'neutral'} className="mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
