import { useTranslation } from 'react-i18next';
import { MapPin, Truck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { simulatedEtaHours } from '@/lib/order-utils';
import type { Order } from '@/types';

interface TrackingDialogProps {
  order: Order;
  open: boolean;
  onClose: () => void;
}

export function TrackingDialog({ order, open, onClose }: TrackingDialogProps) {
  const { t } = useTranslation();
  const etaHours = simulatedEtaHours(order.status);
  const sellerCity = order.seller?.city ?? t('orders.defaultCity');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('orders.trackOrder')}</DialogTitle>
          <DialogDescription>{order.orderNumber}</DialogDescription>
        </DialogHeader>

        <div className="relative rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken h-40 overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(135deg,var(--color-primary)_2px,transparent_2px),linear-gradient(225deg,var(--color-primary)_2px,transparent_2px)] bg-[length:24px_24px]" />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 160" aria-hidden>
            <path d="M40 120 Q120 40 200 80 T280 60" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" strokeDasharray="6 4" />
            <circle cx="40" cy="120" r="6" className="fill-primary" />
            <circle cx="280" cy="60" r="6" className="fill-success" />
          </svg>
          <div className="absolute bottom-2 left-3 flex items-center gap-1 text-xs text-text-secondary">
            <MapPin className="h-3 w-3" />
            {sellerCity}
          </div>
          <div className="absolute top-2 right-3 flex items-center gap-1 text-xs text-text-secondary">
            <Truck className="h-3 w-3" />
            {t('orders.inTransit')}
          </div>
        </div>

        <p className="text-sm text-text-secondary">{t('orders.trackingSimulated')}</p>
        <p className="text-sm font-medium">{t('orders.estimatedDelivery', { hours: etaHours })}</p>
      </DialogContent>
    </Dialog>
  );
}
