import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListSkeleton } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/ui/status-chip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminSellerDetail,
  useAdminSellers,
  useUpdatePharmacyActive,
  useVerifyPharmacy,
  type AdminSellersFilters,
} from '@/hooks/use-admin-sellers';
import {
  verificationStatusVariant,
  type AdminSellerListItem,
  type PharmacyVerificationStatus,
} from '@/lib/admin-sellers';
import { cn } from '@/lib/utils';

const VERIFICATION_FILTERS: Array<PharmacyVerificationStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
];

function parseVerificationParam(value: string | null): PharmacyVerificationStatus | 'ALL' {
  if (value && VERIFICATION_FILTERS.includes(value as PharmacyVerificationStatus)) {
    return value as PharmacyVerificationStatus;
  }
  return 'ALL';
}

export function AdminSellersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [filters, setFilters] = useState<AdminSellersFilters>(() => {
    const activeParam = searchParams.get('isActive');
    const isActive: AdminSellersFilters['isActive'] =
      activeParam === 'active' || activeParam === 'inactive' ? activeParam : 'all';
    return {
      q: searchParams.get('q') ?? '',
      verificationStatus: parseVerificationParam(searchParams.get('verificationStatus')),
      isActive,
    };
  });

  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.q.trim()) next.set('q', filters.q.trim());
    if (filters.verificationStatus !== 'ALL') next.set('verificationStatus', filters.verificationStatus);
    if (filters.isActive !== 'all') next.set('isActive', filters.isActive);
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  const { data, isLoading, isError } = useAdminSellers(filters);
  const sellers = useMemo(() => data?.data ?? [], [data?.data]);

  return (
    <div className="min-h-screen bg-surface-raised" data-testid="admin-sellers-page">
      <TopBar title={t('admin.sellers.title')} showBack />
      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        <p className="text-sm text-text-secondary">{t('admin.sellers.description')}</p>

        <Input
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder={t('admin.sellers.searchPlaceholder')}
          data-testid="admin-sellers-search"
        />

        <div className="flex flex-wrap gap-2" data-testid="admin-sellers-verification-filters">
          {VERIFICATION_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filters.verificationStatus === status
                  ? 'border-primary bg-primary-subtle text-primary'
                  : 'border-border-subtle bg-surface-base text-text-secondary hover:border-border-strong',
              )}
              onClick={() => setFilters((f) => ({ ...f, verificationStatus: status }))}
            >
              {status === 'ALL' ? t('admin.sellers.filterAll') : t(`admin.sellers.status.${status}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'inactive'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium',
                filters.isActive === key
                  ? 'border-primary bg-primary text-white'
                  : 'border-border-subtle text-text-secondary',
              )}
              onClick={() => setFilters((f) => ({ ...f, isActive: key }))}
            >
              {t(`admin.sellers.activeFilter.${key}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <p className="text-center text-danger py-12">{t('admin.sellers.loadError')}</p>
        ) : sellers.length === 0 ? (
          <p className="text-center text-text-secondary py-12" data-testid="admin-sellers-empty">
            {t('admin.sellers.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle bg-surface-base">
            <table className="min-w-full text-sm" data-testid="admin-sellers-table">
              <thead className="bg-surface-raised text-left text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('admin.sellers.columns.pharmacy')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.sellers.columns.owner')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.sellers.columns.verification')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.sellers.columns.listings')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.sellers.columns.account')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.sellers.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <SellerRow key={seller.id} seller={seller} onManage={() => setSelectedId(seller.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SellerDetailDialog
        pharmacyId={selectedId}
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onActionComplete={(message) => toast({ title: message })}
        onError={() => toast({ title: t('admin.sellers.actionFailed'), variant: 'destructive' })}
      />
    </div>
  );
}

function SellerRow({
  seller,
  onManage,
}: {
  seller: AdminSellerListItem;
  onManage: () => void;
}) {
  const { t } = useTranslation();

  return (
    <tr className="border-t border-border-subtle" data-testid={`admin-seller-row-${seller.id}`}>
      <td className="px-3 py-3">
        <p className="font-medium">{seller.name}</p>
        <p className="text-xs text-text-secondary">{seller.city} · {seller.licenseNumber}</p>
      </td>
      <td className="px-3 py-3 text-xs text-text-secondary">
        {seller.owner?.name ?? '—'}
        <br />
        {seller.owner?.email}
      </td>
      <td className="px-3 py-3">
        <StatusChip
          label={t(`admin.sellers.status.${seller.verificationStatus}`)}
          variant={verificationStatusVariant(seller.verificationStatus)}
        />
      </td>
      <td className="px-3 py-3 tabular-nums">{seller.listingCount}</td>
      <td className="px-3 py-3">
        <StatusChip
          label={seller.isActive ? t('admin.sellers.accountActive') : t('admin.sellers.accountSuspended')}
          variant={seller.isActive ? 'success' : 'danger'}
        />
      </td>
      <td className="px-3 py-3">
        <Button size="sm" variant="secondary" onClick={onManage} data-testid={`admin-seller-manage-${seller.id}`}>
          {t('admin.sellers.manage')}
        </Button>
      </td>
    </tr>
  );
}

function SellerDetailDialog({
  pharmacyId,
  open,
  onOpenChange,
  onActionComplete,
  onError,
}: {
  pharmacyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: (message: string) => void;
  onError: () => void;
}) {
  const { t } = useTranslation();
  const { data: seller, isLoading } = useAdminSellerDetail(open ? pharmacyId : null);
  const verify = useVerifyPharmacy();
  const updateActive = useUpdatePharmacyActive();

  const canVerify =
    seller?.verificationStatus === 'PENDING' || seller?.verificationStatus === 'UNDER_REVIEW';

  const handleReject = () => {
    if (!seller) return;
    const reason = window.prompt(t('admin.sellers.rejectReasonPrompt'));
    if (reason === null) return;
    verify.mutate(
      { id: seller.id, action: 'reject', rejectionReason: reason.trim() || undefined },
      {
        onSuccess: () => onActionComplete(t('admin.sellers.rejected')),
        onError,
      },
    );
  };

  const handleApprove = () => {
    if (!seller) return;
    verify.mutate(
      { id: seller.id, action: 'approve' },
      {
        onSuccess: () => onActionComplete(t('admin.sellers.approved')),
        onError,
      },
    );
  };

  const toggleActive = () => {
    if (!seller) return;
    updateActive.mutate(
      { id: seller.id, isActive: !seller.isActive },
      {
        onSuccess: () =>
          onActionComplete(
            seller.isActive ? t('admin.sellers.suspended') : t('admin.sellers.reactivated'),
          ),
        onError,
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="admin-seller-detail-dialog">
        <DialogHeader>
          <DialogTitle>{seller?.name ?? t('admin.sellers.detailTitle')}</DialogTitle>
        </DialogHeader>

        {isLoading || !seller ? (
          <ListSkeleton count={3} />
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <StatusChip
                label={t(`admin.sellers.status.${seller.verificationStatus}`)}
                variant={verificationStatusVariant(seller.verificationStatus)}
              />
              <StatusChip
                label={seller.isActive ? t('admin.sellers.accountActive') : t('admin.sellers.accountSuspended')}
                variant={seller.isActive ? 'success' : 'danger'}
              />
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-text-secondary">{t('admin.sellers.fields.license')}</dt>
              <dd>{seller.licenseNumber}</dd>
              <dt className="text-text-secondary">{t('admin.sellers.fields.address')}</dt>
              <dd>{seller.address}, {seller.city}</dd>
              <dt className="text-text-secondary">{t('admin.sellers.fields.owner')}</dt>
              <dd>{seller.owner?.name} · {seller.owner?.email} · {seller.owner?.phone ?? '—'}</dd>
              <dt className="text-text-secondary">{t('admin.sellers.fields.listings')}</dt>
              <dd>{t('admin.sellers.listingCounts', { active: seller.activeListingCount, total: seller.listingCount })}</dd>
              <dt className="text-text-secondary">{t('admin.sellers.fields.orders')}</dt>
              <dd>{seller.orderCount}</dd>
            </dl>

            {seller.rejectionReason && (
              <p className="text-xs text-danger rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 p-2">
                {seller.rejectionReason}
              </p>
            )}

            {seller.documents.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-xs">{t('admin.sellers.documents')}</p>
                <ul className="space-y-1">
                  {seller.documents.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        {doc.fileName} ({doc.type})
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
              {canVerify && (
                <>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={verify.isPending}
                    onClick={handleReject}
                    data-testid="admin-seller-reject"
                  >
                    {t('admin.reject')}
                  </Button>
                  <Button
                    size="sm"
                    disabled={verify.isPending}
                    onClick={handleApprove}
                    data-testid="admin-seller-approve"
                  >
                    {t('admin.approve')}
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="secondary"
                disabled={updateActive.isPending}
                onClick={toggleActive}
                data-testid="admin-seller-toggle-active"
              >
                {seller.isActive ? t('admin.sellers.suspend') : t('admin.sellers.reactivate')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
