import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AdvancedFilterValues {
  maxPrice?: string;
  minRating?: string;
  radiusKm?: string;
  verifiedOnly?: boolean;
  inStockOnly?: boolean;
  city?: string;
  minDiscount?: string;
}

interface AdvancedFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: AdvancedFilterValues;
  onApply: (values: AdvancedFilterValues) => void;
}

export function AdvancedFiltersSheet({ open, onOpenChange, values, onApply }: AdvancedFiltersSheetProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(values);

  const handleOpen = (next: boolean) => {
    if (next) setDraft(values);
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="pb-8 max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('search.advancedFilters')}</SheetTitle>
          <SheetDescription>{t('search.advancedFiltersSub')}</SheetDescription>
        </SheetHeader>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="adv-city">{t('search.city')}</Label>
            <Input
              id="adv-city"
              value={draft.city ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value || undefined }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adv-max-price">{t('search.maxPrice')}</Label>
            <Input
              id="adv-max-price"
              type="number"
              min={0}
              value={draft.maxPrice ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value || undefined }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adv-min-rating">{t('search.minRating')}</Label>
            <Input
              id="adv-min-rating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={draft.minRating ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, minRating: e.target.value || undefined }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adv-radius">{t('search.maxDistance')}</Label>
            <Input
              id="adv-radius"
              type="number"
              min={1}
              value={draft.radiusKm ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, radiusKm: e.target.value || undefined }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adv-discount">{t('search.minDiscount')}</Label>
            <Input
              id="adv-discount"
              type="number"
              min={0}
              max={100}
              value={draft.minDiscount ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, minDiscount: e.target.value || undefined }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.verifiedOnly ?? false}
              onChange={(e) => setDraft((d) => ({ ...d, verifiedOnly: e.target.checked || undefined }))}
            />
            {t('search.verifiedOnly')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.inStockOnly ?? false}
              onChange={(e) => setDraft((d) => ({ ...d, inStockOnly: e.target.checked || undefined }))}
            />
            {t('search.inStockOnly')}
          </label>
          <Button className="w-full" onClick={() => { onApply(draft); onOpenChange(false); }}>
            {t('search.applyFilters')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
