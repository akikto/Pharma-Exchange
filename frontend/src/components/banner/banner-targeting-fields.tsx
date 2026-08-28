import type { TFunction } from 'i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RADIUS_PRESETS_KM, type BannerFormErrors, type BannerFormValues } from '@/lib/banner-form';
import { cn } from '@/lib/utils';

type BannerTargetingFieldsProps = {
  form: BannerFormValues;
  errors: BannerFormErrors;
  t: TFunction;
  onChange: <K extends keyof BannerFormValues>(key: K, value: BannerFormValues[K]) => void;
  showBannerType?: boolean;
  /** When true, omit outer card styling (parent section provides the box). */
  embedded?: boolean;
};

export function BannerTargetingFields({
  form,
  errors,
  t,
  onChange,
  showBannerType = true,
  embedded = false,
}: BannerTargetingFieldsProps) {
  return (
    <div
      className={cn(
        'space-y-4',
        !embedded && 'rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken/40 p-3',
      )}
    >
      {!embedded ? (
        <p className="text-sm font-medium text-text-primary">{t('admin.banners.targetAudience')}</p>
      ) : null}

      {showBannerType ? (
        <div>
          <Label htmlFor="banner-type">{t('admin.banners.fields.bannerType')}</Label>
          <select
            id="banner-type"
            className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 text-sm"
            value={form.bannerType}
            onChange={(e) => onChange('bannerType', e.target.value as BannerFormValues['bannerType'])}
          >
            <option value="ADMIN">{t('admin.banners.bannerTypes.admin')}</option>
            <option value="SELLER_AD">{t('admin.banners.bannerTypes.sellerAd')}</option>
          </select>
        </div>
      ) : null}

      <div>
        <Label htmlFor="banner-target-type">{t('admin.banners.fields.targetType')}</Label>
        <select
          id="banner-target-type"
          className="w-full h-10 rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 text-sm"
          value={form.targetType}
          onChange={(e) => onChange('targetType', e.target.value as BannerFormValues['targetType'])}
          data-testid="banner-target-type-select"
        >
          <option value="WORLDWIDE">{t('admin.banners.targetTypes.worldwide')}</option>
          <option value="COUNTRY">{t('admin.banners.targetTypes.country')}</option>
          <option value="REGION">{t('admin.banners.targetTypes.region')}</option>
          <option value="CITY">{t('admin.banners.targetTypes.city')}</option>
          <option value="RADIUS">{t('admin.banners.targetTypes.radius')}</option>
        </select>
      </div>

      {form.targetType !== 'WORLDWIDE' ? (
        <div>
          <Label htmlFor="banner-target-country">{t('admin.banners.fields.targetCountry')}</Label>
          <Input
            id="banner-target-country"
            value={form.targetCountry}
            onChange={(e) => onChange('targetCountry', e.target.value)}
            data-testid="banner-target-country"
          />
          {errors.targetCountry ? <p className="text-xs text-danger mt-1">{errors.targetCountry}</p> : null}
        </div>
      ) : null}

      {form.targetType === 'REGION' || form.targetType === 'CITY' || form.targetType === 'RADIUS' ? (
        <div>
          <Label htmlFor="banner-target-state">{t('admin.banners.fields.targetState')}</Label>
          <Input
            id="banner-target-state"
            value={form.targetState}
            onChange={(e) => onChange('targetState', e.target.value)}
            data-testid="banner-target-state"
          />
          {errors.targetState ? <p className="text-xs text-danger mt-1">{errors.targetState}</p> : null}
        </div>
      ) : null}

      {form.targetType === 'CITY' || form.targetType === 'RADIUS' ? (
        <div>
          <Label htmlFor="banner-target-city">{t('admin.banners.fields.targetCity')}</Label>
          <Input
            id="banner-target-city"
            value={form.targetCity}
            onChange={(e) => onChange('targetCity', e.target.value)}
            data-testid="banner-target-city"
          />
          {errors.targetCity ? <p className="text-xs text-danger mt-1">{errors.targetCity}</p> : null}
        </div>
      ) : null}

      {form.targetType === 'RADIUS' ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="banner-target-lat">{t('admin.banners.fields.targetLatitude')}</Label>
              <Input
                id="banner-target-lat"
                value={form.targetLatitude}
                onChange={(e) => onChange('targetLatitude', e.target.value)}
                data-testid="banner-target-latitude"
              />
            </div>
            <div>
              <Label htmlFor="banner-target-lng">{t('admin.banners.fields.targetLongitude')}</Label>
              <Input
                id="banner-target-lng"
                value={form.targetLongitude}
                onChange={(e) => onChange('targetLongitude', e.target.value)}
                data-testid="banner-target-longitude"
              />
            </div>
          </div>
          {errors.targetLatitude ? <p className="text-xs text-danger">{errors.targetLatitude}</p> : null}
          <div>
            <Label htmlFor="banner-radius">{t('admin.banners.fields.radiusKm')}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {RADIUS_PRESETS_KM.map((km) => (
                <button
                  key={km}
                  type="button"
                  className="rounded-full border border-border-subtle px-3 py-1 text-xs"
                  onClick={() => onChange('radiusKm', String(km))}
                >
                  {t('admin.banners.radiusPreset', { km })}
                </button>
              ))}
            </div>
            <Input
              id="banner-radius"
              value={form.radiusKm}
              onChange={(e) => onChange('radiusKm', e.target.value)}
              data-testid="banner-radius-km"
            />
            {errors.radiusKm ? <p className="text-xs text-danger mt-1">{errors.radiusKm}</p> : null}
          </div>
        </>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="banner-starts-at">{t('admin.banners.fields.startsAt')}</Label>
          <Input
            id="banner-starts-at"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => onChange('startsAt', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="banner-ends-at">{t('admin.banners.fields.endsAt')}</Label>
          <Input
            id="banner-ends-at"
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => onChange('endsAt', e.target.value)}
          />
          {errors.endsAt ? <p className="text-xs text-danger mt-1">{errors.endsAt}</p> : null}
        </div>
      </div>

      <div>
        <Label htmlFor="banner-priority">{t('admin.banners.fields.priority')}</Label>
        <Input
          id="banner-priority"
          type="number"
          min={0}
          value={form.priority}
          onChange={(e) => onChange('priority', e.target.value)}
        />
      </div>
    </div>
  );
}
