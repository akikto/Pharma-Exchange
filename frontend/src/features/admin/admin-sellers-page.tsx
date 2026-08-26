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
  useDeletePharmacy,
  useUpdatePharmacy,
  useVerifyPharmacy,
  type AdminSellersFilters,
} from '@/hooks/use-admin-sellers';
import type { AdminPharmacyUpdatePayload } from '@/lib/admin-sellers';
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

const VERIFICATION_QUEUE_FILTERS: Array<PharmacyVerificationStatus> = ['PENDING', 'UNDER_REVIEW'];

export type AdminSellersPageMode = 'sellers' | 'verification-queue';

export type AdminSellersPageProps = {
  mode?: AdminSellersPageMode;
};

function parseVerificationParam(
  value: string | null,
  mode: AdminSellersPageMode,
): PharmacyVerificationStatus | 'ALL' {
  if (mode === 'verification-queue') {
    if (value && VERIFICATION_QUEUE_FILTERS.includes(value as PharmacyVerificationStatus)) {
      return value as PharmacyVerificationStatus;
    }
    return 'PENDING';
  }
  if (value && VERIFICATION_FILTERS.includes(value as PharmacyVerificationStatus)) {
    return value as PharmacyVerificationStatus;
  }
  return 'ALL';
}

export function AdminSellersPage({ mode = 'sellers' }: AdminSellersPageProps) {
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
      verificationStatus: parseVerificationParam(searchParams.get('verificationStatus'), mode),
      isActive,
    };
  });

  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.q.trim()) next.set('q', filters.q.trim());
    if (mode === 'verification-queue') {
      if (filters.verificationStatus !== 'PENDING') {
        next.set('verificationStatus', filters.verificationStatus);
      }
    } else if (filters.verificationStatus !== 'ALL') {
      next.set('verificationStatus', filters.verificationStatus);
    }
    if (filters.isActive !== 'all') next.set('isActive', filters.isActive);
    setSearchParams(next, { replace: true });
  }, [filters, mode, setSearchParams]);

  const { data, isLoading, isError } = useAdminSellers(filters);
  const sellers = useMemo(() => data?.data ?? [], [data?.data]);
  const totalSellers = data?.pagination?.total ?? 0;

  const isVerificationQueue = mode === 'verification-queue';
  const pageTestId = isVerificationQueue ? 'admin-verifications-page' : 'admin-sellers-page';
  const verificationFilters: Array<PharmacyVerificationStatus | 'ALL'> = isVerificationQueue
    ? VERIFICATION_QUEUE_FILTERS
    : VERIFICATION_FILTERS;

  return (
    <div className="bg-surface-raised" data-testid={pageTestId}>
      <TopBar
        title={isVerificationQueue ? t('admin.verificationsQueueTitle') : t('admin.sellers.title')}
        showBack
        backTo="/admin"
      />
      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        <p className="text-sm text-text-secondary">
          {isVerificationQueue ? t('admin.verificationsQueueDescription') : t('admin.sellers.description')}
        </p>

        {!isLoading && !isError && (
          <p className="text-sm font-medium tabular-nums" data-testid="admin-sellers-total-count">
            {t('admin.sellers.totalCount', { count: totalSellers })}
          </p>
        )}

        <Input
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder={t('admin.sellers.searchPlaceholder')}
          data-testid="admin-sellers-search"
        />

        <div className="flex flex-wrap gap-2" data-testid="admin-sellers-verification-filters">
          {verificationFilters.map((status) => (
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

        {!isVerificationQueue && (
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
        )}

        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <p className="text-center text-danger py-12">{t('admin.sellers.loadError')}</p>
        ) : sellers.length === 0 ? (
          <p className="text-center text-text-secondary py-12" data-testid="admin-sellers-empty">
            {isVerificationQueue ? t('admin.noPending') : t('admin.sellers.empty')}
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
        onDeleted={() => setSelectedId(null)}
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
        {seller.owner?.email ?? '—'}
        <br />
        <span data-testid={`admin-seller-owner-phone-${seller.id}`}>
          {seller.owner?.phone ?? '—'}
        </span>
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
  onDeleted,
}: {
  pharmacyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: (message: string) => void;
  onError: () => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const { data: seller, isLoading } = useAdminSellerDetail(open ? pharmacyId : null);
  const verify = useVerifyPharmacy();
  const updatePharmacy = useUpdatePharmacy();
  const deletePharmacy = useDeletePharmacy();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [form, setForm] = useState<AdminPharmacyUpdatePayload>({});
  const [ownerPhone, setOwnerPhone] = useState('');

  useEffect(() => {
    if (!seller) return;
    setForm({
      name: seller.name,
      licenseNumber: seller.licenseNumber,
      address: seller.address,
      city: seller.city,
      district: seller.district,
      postalCode: seller.postalCode ?? '',
      description: seller.description ?? '',
    });
    setOwnerPhone(seller.owner?.phone ?? '');
    setConfirmName('');
    setDeleteOpen(false);
  }, [seller]);

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
    updatePharmacy.mutate(
      { id: seller.id, payload: { isActive: !seller.isActive } },
      {
        onSuccess: () =>
          onActionComplete(
            seller.isActive ? t('admin.sellers.suspended') : t('admin.sellers.reactivated'),
          ),
        onError,
      },
    );
  };

  const saveProfile = () => {
    if (!seller) return;
    updatePharmacy.mutate(
      {
        id: seller.id,
        payload: {
          name: form.name?.trim(),
          licenseNumber: form.licenseNumber?.trim(),
          address: form.address?.trim(),
          city: form.city?.trim(),
          district: form.district?.trim(),
          postalCode: form.postalCode?.trim() || null,
          description: form.description?.trim() || null,
          ownerPhone: ownerPhone.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          onActionComplete(t('admin.sellers.profileSaved'));
        },
        onError,
      },
    );
  };

  const handlePermanentDelete = () => {
    if (!seller) return;
    deletePharmacy.mutate(
      { id: seller.id, confirmName },
      {
        onSuccess: () => {
          setDeleteOpen(false);
          onOpenChange(false);
          onDeleted();
          onActionComplete(t('admin.sellers.deleted'));
        },
        onError,
      },
    );
  };

  return (
    <>
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

              {editOpen ? (
                <div className="space-y-3 border border-border-subtle rounded-[var(--radius-md)] p-3" data-testid="admin-seller-edit-form">
                  <Input value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('admin.sellers.fields.name')} />
                  <Input value={form.licenseNumber ?? ''} onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))} placeholder={t('admin.sellers.fields.license')} />
                  <Input value={form.address ?? ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder={t('admin.sellers.fields.address')} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={form.city ?? ''} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder={t('admin.sellers.fields.city')} />
                    <Input value={form.district ?? ''} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} placeholder={t('admin.sellers.fields.district')} />
                  </div>
                  <Input value={form.postalCode ?? ''} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} placeholder={t('admin.sellers.fields.postalCode')} />
                  <Input
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder={t('admin.sellers.fields.ownerPhone')}
                    inputMode="tel"
                    autoComplete="tel"
                    data-testid="admin-seller-owner-phone-input"
                  />
                  <textarea
                    className="w-full min-h-[72px] rounded-[var(--radius-md)] border border-border-subtle px-3 py-2 text-sm bg-surface-base"
                    value={form.description ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder={t('admin.sellers.fields.description')}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveProfile} disabled={updatePharmacy.isPending} data-testid="admin-seller-save-profile">
                      {t('admin.sellers.saveProfile')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-text-secondary">{t('admin.sellers.fields.license')}</dt>
                  <dd>{seller.licenseNumber}</dd>
                  <dt className="text-text-secondary">{t('admin.sellers.fields.address')}</dt>
                  <dd>{seller.address}, {seller.city}, {seller.district}</dd>
                  <dt className="text-text-secondary">{t('admin.sellers.fields.owner')}</dt>
                  <dd>{seller.owner?.name ?? '—'} · {seller.owner?.email ?? '—'}</dd>
                  <dt className="text-text-secondary">{t('admin.sellers.fields.ownerPhone')}</dt>
                  <dd data-testid="admin-seller-detail-owner-phone">{seller.owner?.phone ?? '—'}</dd>
                  <dt className="text-text-secondary">{t('admin.sellers.fields.listings')}</dt>
                  <dd>{t('admin.sellers.listingCounts', { active: seller.activeListingCount, total: seller.listingCount })}</dd>
                  <dt className="text-text-secondary">{t('admin.sellers.fields.orders')}</dt>
                  <dd>{seller.orderCount}</dd>
                  <dt className="text-text-secondary">{t('admin.sellers.fields.buyRequests')}</dt>
                  <dd>{seller.buyRequestCount}</dd>
                </dl>
              )}

              {seller.rejectionReason && (
                <p className="text-xs text-danger rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 p-2">
                  {seller.rejectionReason}
                </p>
              )}

              {!seller.canPermanentlyDelete && (
                <p className="text-xs text-text-secondary rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-2" data-testid="admin-seller-delete-blocked-hint">
                  {t('admin.sellers.deleteBlockedHint')}
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
                {!editOpen && (
                  <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)} data-testid="admin-seller-edit">
                    {t('admin.sellers.editProfile')}
                  </Button>
                )}
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
                  disabled={updatePharmacy.isPending}
                  onClick={toggleActive}
                  data-testid="admin-seller-toggle-active"
                >
                  {seller.isActive ? t('admin.sellers.suspend') : t('admin.sellers.reactivate')}
                </Button>
                {seller.canPermanentlyDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                    data-testid="admin-seller-delete-open"
                  >
                    {t('admin.sellers.deletePermanent')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md" data-testid="admin-seller-delete-dialog">
          <DialogHeader>
            <DialogTitle>{t('admin.sellers.deleteConfirmTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-secondary">{t('admin.sellers.deleteConfirmBody', { name: seller?.name ?? '' })}</p>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={t('admin.sellers.deleteConfirmPlaceholder')}
            data-testid="admin-seller-delete-confirm-input"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={!seller || confirmName.trim() !== seller.name || deletePharmacy.isPending}
              onClick={handlePermanentDelete}
              data-testid="admin-seller-delete-confirm"
            >
              {t('admin.sellers.deletePermanent')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
