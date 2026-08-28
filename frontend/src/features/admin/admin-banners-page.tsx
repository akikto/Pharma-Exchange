import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/ui/status-chip';
import { BannerFrame } from '@/components/banner/banner-frame';
import { BannerMedia } from '@/components/banner/banner-media';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminBanners,
  useApproveBanner,
  useCreateBanner,
  useDeleteBanner,
  usePauseBanner,
  useRejectBanner,
  useReorderBanners,
  useResumeBanner,
  useToggleBannerActive,
  useUpdateBanner,
} from '@/hooks/use-banners';
import { BannerFormDialog } from '@/features/admin/components/banner-form-dialog';
import { formatBannerTargetSummary, type AdminHomeBanner, type BannerFormValues, type BannerStatus } from '@/lib/banner-form';

const STATUS_FILTERS: Array<BannerStatus | 'ALL'> = [
  'ALL',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'ACTIVE',
  'EXPIRED',
];

export function AdminBannersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<AdminHomeBanner | null>(null);
  const [statusFilter, setStatusFilter] = useState<BannerStatus | 'ALL'>('ALL');

  const filters = useMemo(
    () => (statusFilter === 'ALL' ? undefined : { status: statusFilter }),
    [statusFilter],
  );
  const { data, isLoading, isError } = useAdminBanners(filters);
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const reorderBanners = useReorderBanners();
  const toggleActive = useToggleBannerActive();
  const approveBanner = useApproveBanner();
  const rejectBanner = useRejectBanner();
  const pauseBanner = usePauseBanner();
  const resumeBanner = useResumeBanner();

  const banners = useMemo(() => data ?? [], [data]);

  const openCreate = () => {
    setDialogMode('create');
    setSelected(null);
    setDialogOpen(true);
  };

  const openEdit = (banner: AdminHomeBanner) => {
    setDialogMode('edit');
    setSelected(banner);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: BannerFormValues) => {
    if (dialogMode === 'create') {
      await createBanner.mutateAsync(values);
      toast({ title: t('admin.banners.createSuccess') });
      return;
    }
    if (!selected) return;
    await updateBanner.mutateAsync({ id: selected.id, values });
    toast({ title: t('admin.banners.updateSuccess') });
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    const orderedIds = banners.map((b) => b.id);
    const next = [...orderedIds];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    await reorderBanners.mutateAsync(next);
  };

  const handleDelete = async (banner: AdminHomeBanner) => {
    if (!window.confirm(t('admin.banners.deleteConfirm', { title: banner.title }))) return;
    await deleteBanner.mutateAsync(banner.id);
    toast({ title: t('admin.banners.deleteSuccess') });
  };

  const handleReject = async (banner: AdminHomeBanner) => {
    const rejectionReason = window.prompt(t('admin.banners.rejectPrompt'));
    if (!rejectionReason?.trim()) return;
    await rejectBanner.mutateAsync({ id: banner.id, rejectionReason: rejectionReason.trim() });
    toast({ title: t('admin.banners.rejectSuccess') });
  };

  return (
    <div className="bg-surface-raised" data-testid="admin-banners-page">
      <TopBar title={t('admin.banners.title')} showBack backTo="/admin" />
      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">{t('admin.banners.description')}</p>
          <Button onClick={openCreate} data-testid="admin-banners-add-button">
            {t('admin.banners.addButton')}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2" data-testid="admin-banners-status-filters">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs ${
                statusFilter === status ? 'border-primary bg-primary text-white' : 'border-border-subtle'
              }`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'ALL' ? t('admin.banners.filterAll') : t(`sellerAds.status.${status}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <p className="text-center text-danger py-12">{t('admin.banners.loadError')}</p>
        ) : banners.length === 0 ? (
          <p className="text-center text-text-secondary py-12" data-testid="admin-banners-empty">
            {t('admin.banners.empty')}
          </p>
        ) : (
          <div className="space-y-4">
            {banners.map((banner, index) => (
              <article
                key={banner.id}
                className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-base p-3 space-y-3"
                data-testid={`admin-banner-row-${banner.id}`}
              >
                <div className="max-w-md">
                  <BannerFrame>
                    <BannerMedia
                      mediaUrl={banner.mediaUrl}
                      mediaType={banner.mediaType}
                      alt={banner.mediaAlt || banner.title}
                      isActive
                    />
                  </BannerFrame>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{banner.title}</p>
                    <p className="text-xs text-text-secondary">
                      {banner.bannerType === 'SELLER_AD' ? t('admin.banners.bannerTypes.sellerAd') : t('admin.banners.bannerTypes.admin')}
                      {' · '}
                      {t('admin.banners.statusLabel', { status: t(`sellerAds.status.${banner.status}`) })}
                    </p>
                    {banner.advertiserPharmacy ? (
                      <p className="text-xs text-text-secondary">
                        {t('admin.banners.advertiserLabel', { name: banner.advertiserPharmacy.name })}
                      </p>
                    ) : null}
                    <p className="text-xs text-text-secondary mt-1">
                      {t('admin.banners.targetLabel', { target: formatBannerTargetSummary(banner, t) })}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {t('admin.banners.actionSummary', {
                        type: banner.actionType,
                        target: banner.actionTarget || '—',
                      })}
                    </p>
                    {banner.rejectionReason ? (
                      <p className="text-xs text-danger mt-1">
                        {t('sellerAds.rejectionReason', { reason: banner.rejectionReason })}
                      </p>
                    ) : null}
                  </div>
                  <StatusChip
                    label={banner.isActive ? t('admin.banners.active') : t('admin.banners.inactive')}
                    variant={banner.isActive ? 'success' : 'warning'}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(banner)}>
                    <Pencil className="h-3.5 w-3.5" /> {t('admin.medicines.editAction')}
                  </Button>
                  {banner.status === 'PENDING_APPROVAL' ? (
                    <>
                      <Button size="sm" onClick={() => approveBanner.mutateAsync(banner.id).then(() => toast({ title: t('admin.banners.approveSuccess') }))}>
                        {t('admin.banners.approve')}
                      </Button>
                      <Button size="sm" variant="tertiary" onClick={() => void handleReject(banner)}>
                        {t('admin.banners.reject')}
                      </Button>
                    </>
                  ) : null}
                  {banner.status === 'ACTIVE' || banner.status === 'APPROVED' ? (
                    <Button size="sm" variant="secondary" onClick={() => pauseBanner.mutateAsync(banner.id)}>
                      {t('admin.banners.pause')}
                    </Button>
                  ) : null}
                  {banner.status === 'PAUSED' ? (
                    <Button size="sm" variant="secondary" onClick={() => resumeBanner.mutateAsync(banner.id)}>
                      {t('admin.banners.resume')}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleActive.mutate({ id: banner.id, isActive: !banner.isActive })}
                  >
                    {banner.isActive ? t('admin.banners.deactivate') : t('admin.banners.activate')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => move(index, -1)} disabled={index === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => move(index, 1)}
                    disabled={index === banners.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="tertiary" onClick={() => handleDelete(banner)}>
                    <Trash2 className="h-3.5 w-3.5" /> {t('admin.banners.deleteButton')}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <BannerFormDialog
        open={dialogOpen}
        mode={dialogMode}
        banner={selected}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={createBanner.isPending || updateBanner.isPending}
      />
    </div>
  );
}
