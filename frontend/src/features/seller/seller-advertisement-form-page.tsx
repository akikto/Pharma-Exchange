import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BannerFrame } from '@/components/banner/banner-frame';
import { BannerMedia } from '@/components/banner/banner-media';
import { BannerTargetingFields } from '@/components/banner/banner-targeting-fields';
import { BannerFormSection } from '@/components/banner/banner-form-section';
import { useBannerMediaUpload } from '@/hooks/use-banner-media-upload';
import { useListings } from '@/hooks/use-listings';
import { useToast } from '@/hooks/use-toast';
import {
  useCancelSellerAdvertisement,
  useCreateSellerAdvertisement,
  useSellerAdvertisement,
  useUpdateSellerAdvertisement,
} from '@/hooks/use-advertisements';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage } from '@/lib/api-errors';
import { isValidBannerMediaHttpUrl } from '@/lib/banner-media-url';
import {
  EMPTY_BANNER_FORM,
  bannerToForm,
  validateBannerForm,
  type BannerActionType,
  type BannerFormErrors,
  type BannerFormValues,
} from '@/lib/banner-form';

export function SellerAdvertisementFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const pharmacy = useAuthStore((s) => s.user?.pharmacy);
  const [form, setForm] = useState<BannerFormValues>(EMPTY_BANNER_FORM);
  const [errors, setErrors] = useState<BannerFormErrors>({});
  const [listingSearch, setListingSearch] = useState('');
  const uploadMedia = useBannerMediaUpload();
  const createAd = useCreateSellerAdvertisement();
  const updateAd = useUpdateSellerAdvertisement();
  const cancelAd = useCancelSellerAdvertisement();
  const { data: existing } = useSellerAdvertisement(id);
  const { data: listingsPages } = useListings(
    { pharmacyId: pharmacy?.id, status: 'ACTIVE', limit: 50 },
    { enabled: Boolean(pharmacy?.id) },
  );

  useEffect(() => {
    if (existing) setForm(bannerToForm(existing));
  }, [existing]);

  const listingOptions = useMemo(() => {
    const listings = listingsPages?.pages.flatMap((page) => page.data) ?? [];
    const query = listingSearch.trim().toLowerCase();
    if (!query) return listings;
    return listings.filter((listing) => listing.medicine.name.toLowerCase().includes(query));
  }, [listingsPages, listingSearch]);

  const updateField = <K extends keyof BannerFormValues>(key: K, value: BannerFormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleActionTypeChange = (actionType: BannerActionType) => {
    setForm((current) => ({ ...current, actionType, actionTarget: '' }));
    setErrors({});
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = await uploadMedia.mutateAsync(file);
      if (!result.url?.trim() || !isValidBannerMediaHttpUrl(result.url)) {
        toast({ title: t('admin.banners.uploadError'), variant: 'destructive' });
        return;
      }
      updateField('mediaUrl', result.url);
      updateField('mediaType', file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
    } catch (error) {
      toast({ title: t('admin.banners.uploadError'), description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    const nextErrors = validateBannerForm(form, t);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (isEdit && id) {
      await updateAd.mutateAsync({ id, values: form });
      toast({ title: t('sellerAds.updateSuccess') });
    } else {
      await createAd.mutateAsync(form);
      toast({ title: t('sellerAds.createSuccess') });
    }
    navigate('/seller/advertisements');
  };

  const handleCancel = async () => {
    if (!id) return;
    if (!window.confirm(t('sellerAds.cancelConfirm'))) return;
    await cancelAd.mutateAsync(id);
    toast({ title: t('sellerAds.cancelSuccess') });
    navigate('/seller/advertisements');
  };

  return (
    <div data-testid="seller-advertisement-form-page">
      <TopBar
        title={isEdit ? t('sellerAds.editTitle') : t('sellerAds.createTitle')}
        showBack
        backTo="/seller/advertisements"
      />
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {form.mediaUrl ? (
          <BannerFrame>
            <BannerMedia mediaUrl={form.mediaUrl} mediaType={form.mediaType} alt={form.title} isActive priority />
          </BannerFrame>
        ) : null}

        <div>
          <Label htmlFor="seller-ad-media">{t('admin.banners.fields.media')}</Label>
          <Input id="seller-ad-media" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={handleFileChange} />
        </div>

        <div>
          <Label htmlFor="seller-ad-title">{t('admin.banners.fields.title')}</Label>
          <Input id="seller-ad-title" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
        </div>

        <div>
          <Label htmlFor="seller-ad-subtitle">{t('admin.banners.fields.subtitle')}</Label>
          <Input id="seller-ad-subtitle" value={form.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} />
        </div>

        <BannerFormSection
          variant="click-action"
          title={t('admin.banners.fields.actionType')}
          description={t('admin.banners.clickActionHint')}
          testId="seller-ad-click-action-section"
        >
          <div>
            <select
              id="seller-ad-action-type"
              aria-label={t('admin.banners.fields.actionType')}
              className="w-full h-10 rounded-[var(--radius-md)] border border-info/25 bg-surface-base px-3 text-sm"
              value={form.actionType}
              onChange={(e) => handleActionTypeChange(e.target.value as BannerActionType)}
            >
              <option value="MEDICINE">{t('admin.banners.actionTypes.medicine')}</option>
              <option value="PHARMACY">{t('admin.banners.actionTypes.pharmacy')}</option>
              <option value="LISTING">{t('admin.banners.actionTypes.listing')}</option>
            </select>
            <p className="text-xs text-info/80 mt-1">{t('sellerAds.sellerActionHint')}</p>
          </div>

          {form.actionType === 'PHARMACY' ? (
            <div>
              <Label>{t('admin.banners.fields.pharmacy')}</Label>
              <Input value={pharmacy?.name ?? ''} disabled />
              <input type="hidden" value={pharmacy?.id ?? ''} />
              {pharmacy?.id ? (
                <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => updateField('actionTarget', pharmacy.id)}>
                  {t('admin.banners.selectPharmacy')}
                </Button>
              ) : null}
            </div>
          ) : null}

          {form.actionType === 'LISTING' ? (
            <div className="space-y-2">
              <Label htmlFor="seller-ad-listing-search">{t('admin.banners.fields.listingItem')}</Label>
              <Input id="seller-ad-listing-search" value={listingSearch} onChange={(e) => setListingSearch(e.target.value)} />
              <select
                className="w-full h-10 rounded-[var(--radius-md)] border border-info/25 bg-surface-base px-3 text-sm"
                value={form.actionTarget}
                onChange={(e) => updateField('actionTarget', e.target.value)}
                data-testid="seller-ad-listing-select"
              >
                <option value="">{t('admin.banners.selectListing')}</option>
                {listingOptions.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.medicine.name} · {listing.batchNumber}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {form.actionType === 'MEDICINE' ? (
            <div>
              <Label htmlFor="seller-ad-medicine-id">{t('admin.banners.fields.medicine')}</Label>
              <Input
                id="seller-ad-medicine-id"
                value={form.actionTarget}
                onChange={(e) => updateField('actionTarget', e.target.value)}
                placeholder={t('admin.banners.selectMedicine')}
              />
            </div>
          ) : null}
        </BannerFormSection>

        <BannerTargetingFields
          form={form}
          errors={errors}
          t={t}
          onChange={updateField}
          showBannerType={false}
          radiusCenterHint={
            form.targetType === 'RADIUS' && pharmacy?.name
              ? t('sellerAds.radiusCenterHint', { shop: pharmacy.name })
              : undefined
          }
        />

        <div className="flex gap-2">
          <Button onClick={() => void handleSubmit()} disabled={createAd.isPending || updateAd.isPending}>
            {t('common.submit')}
          </Button>
          {isEdit ? (
            <Button variant="tertiary" onClick={() => void handleCancel()}>
              {t('sellerAds.cancelButton')}
            </Button>
          ) : (
            <Link to="/seller/advertisements">
              <Button variant="secondary">{t('common.cancel')}</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
