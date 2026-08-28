import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BannerFrame } from '@/components/banner/banner-frame';
import { BannerMedia } from '@/components/banner/banner-media';
import { useBannerMediaUpload } from '@/hooks/use-banner-media-upload';
import { useToast } from '@/hooks/use-toast';
import { isValidBannerMediaHttpUrl } from '@/lib/banner-media-url';
import { useAdminMedicines } from '@/hooks/use-admin-medicines';
import { useAdminSellers, type AdminSellersFilters } from '@/hooks/use-admin-sellers';
import { useListings } from '@/hooks/use-listings';
import { apiClient } from '@/lib/api';
import type { Listing } from '@/types';
import { getErrorMessage } from '@/lib/api-errors';
import {
  EMPTY_BANNER_FORM,
  INTERNAL_BANNER_PATHS,
  bannerToForm,
  validateBannerForm,
  type AdminHomeBanner,
  type BannerActionType,
  type BannerFormErrors,
  type BannerFormValues,
  type BannerMediaType,
} from '@/lib/banner-form';
import { BannerTargetingFields } from '@/components/banner/banner-targeting-fields';

type BannerFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  banner?: AdminHomeBanner | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BannerFormValues) => Promise<void>;
  isSubmitting?: boolean;
};

export function BannerFormDialog({
  open,
  mode,
  banner,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: BannerFormDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState<BannerFormValues>(EMPTY_BANNER_FORM);
  const [errors, setErrors] = useState<BannerFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [listingShopId, setListingShopId] = useState('');
  const [listingShopSearch, setListingShopSearch] = useState('');
  const [listingItemSearch, setListingItemSearch] = useState('');
  const uploadMedia = useBannerMediaUpload();
  const { data: medicineResults } = useAdminMedicines(medicineSearch);
  const pharmacyFilters: AdminSellersFilters = useMemo(
    () => ({ q: pharmacySearch, verificationStatus: 'ALL', isActive: 'all' }),
    [pharmacySearch],
  );
  const { data: pharmacyResults } = useAdminSellers(pharmacyFilters);
  const listingShopFilters: AdminSellersFilters = useMemo(
    () => ({ q: listingShopSearch, verificationStatus: 'ALL', isActive: 'all' }),
    [listingShopSearch],
  );
  const { data: listingShopResults } = useAdminSellers(listingShopFilters);
  const listingPrefillTarget =
    open && banner?.actionType === 'LISTING' ? banner.actionTarget?.trim() ?? '' : '';
  const { data: listingPrefill } = useQuery({
    queryKey: ['banner-listing-prefill', listingPrefillTarget],
    queryFn: () => apiClient.get<Listing>(`/listings/${listingPrefillTarget}`),
    enabled: Boolean(listingPrefillTarget) && !listingShopId,
  });
  const { data: shopListingsPages } = useListings(
    { pharmacyId: listingShopId, status: 'ACTIVE', limit: 50 },
    { enabled: open && form.actionType === 'LISTING' && Boolean(listingShopId) },
  );

  useEffect(() => {
    if (!open) return;
    setForm(mode === 'edit' && banner ? bannerToForm(banner) : EMPTY_BANNER_FORM);
    setErrors({});
    setSubmitError('');
    setMedicineSearch('');
    setPharmacySearch('');
    setListingShopId('');
    setListingShopSearch('');
    setListingItemSearch('');
  }, [open, mode, banner]);

  useEffect(() => {
    if (listingPrefill?.pharmacy?.id) {
      setListingShopId(listingPrefill.pharmacy.id);
    }
  }, [listingPrefill?.pharmacy?.id]);

  const previewAlt = useMemo(
    () => form.mediaAlt.trim() || form.title.trim() || t('admin.banners.previewFallback'),
    [form.mediaAlt, form.title, t],
  );

  const updateField = <K extends keyof BannerFormValues>(key: K, value: BannerFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSubmitError('');
  };

  const handleActionTypeChange = (actionType: BannerActionType) => {
    setForm((current) => ({ ...current, actionType, actionTarget: '' }));
    setListingShopId('');
    setListingItemSearch('');
    setErrors({});
    setSubmitError('');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = await uploadMedia.mutateAsync(file);
      if (!result.url?.trim() || !isValidBannerMediaHttpUrl(result.url)) {
        toast({
          title: t('admin.banners.uploadError'),
          description: t('admin.banners.validation.invalidMediaUrl'),
          variant: 'destructive',
        });
        return;
      }
      updateField('mediaUrl', result.url);
      if (file.type.startsWith('video/')) updateField('mediaType', 'VIDEO' as BannerMediaType);
      else updateField('mediaType', 'IMAGE' as BannerMediaType);
    } catch (error) {
      const message = getErrorMessage(error, t('admin.banners.uploadError'));
      setSubmitError(message);
      toast({ title: t('admin.banners.uploadError'), description: message, variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    const nextErrors = validateBannerForm(form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(getErrorMessage(error, t('common.error')));
    }
  };

  const medicineOptions = medicineResults?.data ?? [];
  const pharmacyOptions = pharmacyResults?.data ?? [];
  const listingShopOptions = listingShopResults?.data ?? [];
  const shopListingOptions = useMemo(() => {
    const listings = shopListingsPages?.pages.flatMap((page) => page.data) ?? [];
    const query = listingItemSearch.trim().toLowerCase();
    if (!query) return listings;
    return listings.filter((listing) => {
      const name = listing.medicine.name.toLowerCase();
      const batch = listing.batchNumber.toLowerCase();
      return name.includes(query) || batch.includes(query);
    });
  }, [shopListingsPages, listingItemSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="banner-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('admin.banners.createTitle') : t('admin.banners.editTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {form.mediaUrl ? (
            <BannerFrame testId="banner-form-preview">
              <BannerMedia
                mediaUrl={form.mediaUrl}
                mediaType={form.mediaType}
                alt={previewAlt}
                isActive
                priority
              />
            </BannerFrame>
          ) : (
            <BannerFrame testId="banner-form-preview-empty">
              <div className="absolute inset-0 flex items-center justify-center text-sm text-text-secondary">
                {t('admin.banners.previewEmpty')}
              </div>
            </BannerFrame>
          )}

          <div>
            <Label htmlFor="banner-media-file">{t('admin.banners.fields.media')}</Label>
            <Input
              id="banner-media-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              onChange={handleFileChange}
              disabled={uploadMedia.isPending}
            />
            {errors.mediaUrl ? <p className="text-xs text-danger mt-1">{errors.mediaUrl}</p> : null}
          </div>

          <div>
            <Label htmlFor="banner-title">{t('admin.banners.fields.title')}</Label>
            <Input id="banner-title" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
            {errors.title ? <p className="text-xs text-danger mt-1">{errors.title}</p> : null}
          </div>

          <div>
            <Label htmlFor="banner-subtitle">{t('admin.banners.fields.subtitle')}</Label>
            <Input id="banner-subtitle" value={form.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} />
          </div>

          <div>
            <Label htmlFor="banner-cta">{t('admin.banners.fields.ctaText')}</Label>
            <Input id="banner-cta" value={form.ctaText} onChange={(e) => updateField('ctaText', e.target.value)} />
          </div>

          <div>
            <Label htmlFor="banner-alt">{t('admin.banners.fields.mediaAlt')}</Label>
            <Input id="banner-alt" value={form.mediaAlt} onChange={(e) => updateField('mediaAlt', e.target.value)} />
          </div>

          <div>
            <Label htmlFor="banner-action-type">{t('admin.banners.fields.actionType')}</Label>
            <select
              id="banner-action-type"
              className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 text-sm"
              value={form.actionType}
              onChange={(e) => handleActionTypeChange(e.target.value as BannerActionType)}
            >
              <option value="NONE">{t('admin.banners.actionTypes.none')}</option>
              <option value="EXTERNAL_URL">{t('admin.banners.actionTypes.external')}</option>
              <option value="INTERNAL_PATH">{t('admin.banners.actionTypes.internal')}</option>
              <option value="MEDICINE">{t('admin.banners.actionTypes.medicine')}</option>
              <option value="LISTING">{t('admin.banners.actionTypes.listing')}</option>
              <option value="PHARMACY">{t('admin.banners.actionTypes.pharmacy')}</option>
              <option value="CATEGORY">{t('admin.banners.actionTypes.category')}</option>
            </select>
          </div>

          {form.actionType === 'INTERNAL_PATH' ? (
            <div>
              <Label htmlFor="banner-internal-path">{t('admin.banners.fields.actionTarget')}</Label>
              <select
                id="banner-internal-path"
                className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 text-sm"
                value={form.actionTarget}
                onChange={(e) => updateField('actionTarget', e.target.value)}
              >
                <option value="">{t('admin.banners.selectPath')}</option>
                {INTERNAL_BANNER_PATHS.map((path) => (
                  <option key={path.value} value={path.value}>
                    {t(path.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {form.actionType === 'MEDICINE' ? (
            <div className="space-y-2">
              <Label htmlFor="banner-medicine-search">{t('admin.banners.fields.medicine')}</Label>
              <Input
                id="banner-medicine-search"
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                placeholder={t('admin.banners.medicineSearchPlaceholder')}
              />
              <select
                className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 text-sm"
                value={form.actionTarget}
                onChange={(e) => updateField('actionTarget', e.target.value)}
              >
                <option value="">{t('admin.banners.selectMedicine')}</option>
                {medicineOptions.map((medicine) => (
                  <option key={medicine.id} value={medicine.id}>
                    {medicine.name} — {medicine.company}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {form.actionType === 'LISTING' ? (
            <div className="space-y-3 rounded-[var(--radius-md)] border border-border-subtle p-3">
              <p className="text-xs text-text-secondary">{t('admin.banners.listingActionHint')}</p>
              <div className="space-y-2">
                <Label htmlFor="banner-listing-shop-search">{t('admin.banners.fields.pharmacy')}</Label>
                <Input
                  id="banner-listing-shop-search"
                  value={listingShopSearch}
                  onChange={(e) => setListingShopSearch(e.target.value)}
                  placeholder={t('admin.banners.pharmacySearchPlaceholder')}
                />
                <select
                  className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 text-sm"
                  value={listingShopId}
                  onChange={(e) => {
                    setListingShopId(e.target.value);
                    updateField('actionTarget', '');
                  }}
                  data-testid="banner-listing-shop-select"
                >
                  <option value="">{t('admin.banners.selectPharmacy')}</option>
                  {listingShopOptions.map((pharmacy) => (
                    <option key={pharmacy.id} value={pharmacy.id}>
                      {pharmacy.name} — {pharmacy.city}
                    </option>
                  ))}
                </select>
              </div>
              {listingShopId ? (
                <div className="space-y-2">
                  <Label htmlFor="banner-listing-item-search">{t('admin.banners.fields.listingItem')}</Label>
                  <Input
                    id="banner-listing-item-search"
                    value={listingItemSearch}
                    onChange={(e) => setListingItemSearch(e.target.value)}
                    placeholder={t('admin.banners.listingSearchPlaceholder')}
                  />
                  <select
                    className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 text-sm"
                    value={form.actionTarget}
                    onChange={(e) => updateField('actionTarget', e.target.value)}
                    data-testid="banner-listing-item-select"
                  >
                    <option value="">{t('admin.banners.selectListing')}</option>
                    {form.actionTarget &&
                    !shopListingOptions.some((listing) => listing.id === form.actionTarget) ? (
                      <option value={form.actionTarget}>{form.actionTarget}</option>
                    ) : null}
                    {shopListingOptions.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.medicine.name} · {listing.batchNumber} · {listing.availableQty} left
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ) : null}

          {form.actionType === 'PHARMACY' ? (
            <div className="space-y-2">
              <Label htmlFor="banner-pharmacy-search">{t('admin.banners.fields.pharmacy')}</Label>
              <Input
                id="banner-pharmacy-search"
                data-testid="banner-pharmacy-search"
                value={pharmacySearch}
                onChange={(e) => setPharmacySearch(e.target.value)}
                placeholder={t('admin.banners.pharmacySearchPlaceholder')}
              />
              <select
                className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 text-sm"
                value={form.actionTarget}
                onChange={(e) => updateField('actionTarget', e.target.value)}
                data-testid="banner-pharmacy-select"
              >
                <option value="">{t('admin.banners.selectPharmacy')}</option>
                {form.actionTarget &&
                !pharmacyOptions.some((pharmacy) => pharmacy.id === form.actionTarget) ? (
                  <option value={form.actionTarget}>{form.actionTarget}</option>
                ) : null}
                {pharmacyOptions.map((pharmacy) => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.name} — {pharmacy.city}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-secondary">{t('admin.banners.pharmacySelectHint')}</p>
            </div>
          ) : null}

          {form.actionType === 'CATEGORY' || form.actionType === 'EXTERNAL_URL' ? (
            <div>
              <Label htmlFor="banner-action-target">{t('admin.banners.fields.actionTarget')}</Label>
              <Input
                id="banner-action-target"
                value={form.actionTarget}
                onChange={(e) => updateField('actionTarget', e.target.value)}
                placeholder={
                  form.actionType === 'CATEGORY'
                    ? t('admin.banners.categoryPlaceholder')
                    : 'https://'
                }
              />
            </div>
          ) : null}

          {errors.actionTarget ? <p className="text-xs text-danger">{errors.actionTarget}</p> : null}

          <div className="flex items-center gap-2">
            <input
              id="banner-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
            />
            <Label htmlFor="banner-active">{t('admin.banners.fields.isActive')}</Label>
          </div>

          <div>
            <Label htmlFor="banner-sort">{t('admin.banners.fields.sortOrder')}</Label>
            <Input
              id="banner-sort"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => updateField('sortOrder', e.target.value)}
            />
          </div>

          <section
            className="space-y-3 rounded-[var(--radius-md)] border-2 border-dashed border-primary/25 bg-surface-sunken/60 p-4"
            data-testid="banner-targeting-section"
          >
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{t('admin.banners.targetingSectionTitle')}</h3>
              <p className="text-xs text-text-secondary mt-1">{t('admin.banners.targetingSectionDescription')}</p>
            </div>
            <BannerTargetingFields form={form} errors={errors} t={t} onChange={updateField} embedded />
          </section>

          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || uploadMedia.isPending}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
