import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generatePriceTrend } from '@/lib/offer-utils';
import { formatPrice } from '@/lib/utils';

interface PriceTrendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicineId: string;
  medicineName: string;
  currentPrice: number;
}

export function PriceTrendDialog({ open, onOpenChange, medicineId, medicineName, currentPrice }: PriceTrendDialogProps) {
  const { t } = useTranslation();
  const trend = useMemo(() => generatePriceTrend(medicineId, currentPrice), [medicineId, currentPrice]);
  const maxPrice = Math.max(...trend.map((p) => p.price));
  const minPrice = Math.min(...trend.map((p) => p.price));
  const range = maxPrice - minPrice || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('offer.priceTrend')}
          </DialogTitle>
          <DialogDescription>{medicineName} · {t('offer.priceTrendSub')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3" data-testid="price-trend-chart">
          <div className="flex items-end gap-0.5 h-32 px-1">
            {trend.map((point) => {
              const height = ((point.price - minPrice) / range) * 100;
              return (
                <div
                  key={point.date}
                  className="flex-1 bg-primary/80 rounded-t-sm min-h-[4px]"
                  style={{ height: `${Math.max(8, height)}%` }}
                  title={`${point.date}: ${formatPrice(point.price)}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>{trend[0]?.date}</span>
            <span className="font-medium text-primary">{formatPrice(currentPrice)}</span>
            <span>{trend[trend.length - 1]?.date}</span>
          </div>
          <p className="text-[10px] text-text-disabled">{t('offer.priceTrendDisclaimer')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
