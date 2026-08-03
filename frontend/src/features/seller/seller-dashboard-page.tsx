import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Package, Inbox, TrendingUp, AlertTriangle, LogIn, ShieldCheck, Boxes } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useSellerAnalytics, useBuyRequests } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';
import { formatPrice } from '@/lib/utils';
import { useShellStore } from '@/stores/shell-store';

export function SellerDashboardPage() {
  const { t } = useTranslation();
  const openModal = useShellStore((s) => s.openModal);
  const { isAuthenticated, user } = useAuthStore();
  const pharmacy = user?.pharmacy;
  const isApprovedSeller = Boolean(pharmacy && pharmacy.verificationStatus === 'APPROVED');

  const { data: analytics, isLoading, isError } = useSellerAnalytics({ enabled: isApprovedSeller });
  const { data: requests } = useBuyRequests('seller', { enabled: isApprovedSeller });

  if (!isAuthenticated) {
    return (
      <div>
        <TopBar showLogo title={t('seller.title')} />
        <div className="p-4">
          <div className="rounded-[var(--radius-md)] border border-primary/30 bg-primary-subtle p-6 text-center space-y-4">
            <LogIn className="h-10 w-10 mx-auto text-primary" />
            <div>
              <p className="font-semibold">{t('inventory.authPromptTitle')}</p>
              <p className="text-sm text-text-secondary mt-1">{t('inventory.authPromptDesc')}</p>
            </div>
            <Link to="/login"><Button className="w-full">{t('auth.signIn')}</Button></Link>
            <Link to="/register" className="text-sm text-primary block">{t('auth.createAccount')}</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div>
        <TopBar showLogo title={t('seller.title')} />
        <div className="p-4 text-center space-y-4">
          <p className="text-text-secondary">{t('inventory.registerPharmacy')}</p>
          <Link to="/pharmacy/register"><Button>{t('inventory.registerPharmacyCta')}</Button></Link>
        </div>
      </div>
    );
  }

  if (!isApprovedSeller) {
    return (
      <div>
        <TopBar showLogo title={t('seller.title')} />
        <div className="p-4">
          <AuthStatusPill name={pharmacy.name} status={pharmacy.verificationStatus} />
          <p className="text-center text-text-secondary mt-8">{t('inventory.pendingVerification')}</p>
          <Link to="/profile" className="block text-center mt-4 text-sm text-primary">{t('inventory.viewProfile')}</Link>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-4"><ListSkeleton count={3} /></div>;
  if (isError) return <div className="p-4 text-center text-danger">{t('common.error')}</div>;

  return (
    <div>
      <TopBar
        showLogo
        title={t('seller.title')}
        actions={<AuthStatusPill name={pharmacy.name} status="APPROVED" compact />}
      />
      <div className="p-4 space-y-6">
        <AuthStatusPill name={pharmacy.name} status="APPROVED" />

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

      <button
        type="button"
        onClick={() => openModal('bulk')}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary text-on-primary shadow-lg px-4 py-3 font-medium text-sm"
        data-testid="bulk-fab"
        aria-label={t('bulk.fabLabel')}
      >
        <Boxes className="h-5 w-5" />
        {t('bulk.fabLabel')}
      </button>
    </div>
  );
}

function AuthStatusPill({
  name,
  status,
  compact = false,
}: {
  name: string;
  status: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const isApproved = status === 'APPROVED';

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded-full max-w-[140px]">
        <ShieldCheck className="h-3 w-3 shrink-0" />
        <span className="truncate">{name}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-3" data-testid="seller-auth-pill">
      <div className="h-10 w-10 rounded-full bg-primary-subtle flex items-center justify-center text-primary font-bold shrink-0">
        {name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{name}</p>
        <p className="text-xs text-text-secondary">{t('inventory.signedInAs')}</p>
      </div>
      <StatusChip
        label={isApproved ? t('inventory.verifiedSeller') : status}
        variant={isApproved ? 'success' : 'warning'}
      />
    </div>
  );
}
