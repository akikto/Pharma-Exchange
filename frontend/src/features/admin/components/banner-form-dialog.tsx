import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useAdminMedicines } from '@/hooks/use-admin-medicines';
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
  const [form, setForm] = useState<BannerFormValues>(EMPTY_BANNER_FORM);
  const [errors, setErrors] = useState<BannerFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  const uploadMedia = useBannerMediaUpload();
  const { data: medicineResults } = useAdminMedicines(medicineSearch);

  useEffect(() => {
    if (!open) return;
    setForm(mode === 'edit' && banner ? bannerToForm(banner) : EMPTY_BANNER_FORM);
    setErrors({});
    setSubmitError('');
    setMedicineSearch('');
  }, [open, mode, banner]);

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = await uploadMedia.mutateAsync(file);
      updateField('mediaUrl', result.url);
      if (file.type.startsWith('video/')) updateField('mediaType', 'VIDEO' as BannerMediaType);
      else updateField('mediaType', 'IMAGE' as BannerMediaType);
    } catch (error) {
      setSubmitError(getErrorMessage(error, t('admin.banners.uploadError')));
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
              onChange={(e) => updateField('actionType', e.target.value as BannerActionType)}
            >
              <option value="NONE">{t('admin.banners.actionTypes.none')}</option>
              <option value="EXTERNAL_URL">{t('admin.banners.actionTypes.external')}</option>
              <option value="INTERNAL_PATH">{t('admin.banners.actionTypes.internal')}</option>
              <option value="MEDICINE">{t('admin.banners.actionTypes.medicine')}</option>
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

          {form.actionType === 'PHARMACY' || form.actionType === 'CATEGORY' || form.actionType === 'EXTERNAL_URL' ? (
            <div>
              <Label htmlFor="banner-action-target">{t('admin.banners.fields.actionTarget')}</Label>
              <Input
                id="banner-action-target"
                value={form.actionTarget}
                onChange={(e) => updateField('actionTarget', e.target.value)}
                placeholder={
                  form.actionType === 'PHARMACY'
                    ? t('admin.banners.pharmacyIdPlaceholder')
                    : form.actionType === 'CATEGORY'
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
