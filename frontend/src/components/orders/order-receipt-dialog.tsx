import { useTranslation } from 'react-i18next';
import { Share2, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { buildOrderReceiptText } from '@/lib/order-utils';
import { downloadTextFile } from '@/lib/download-utils';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

interface OrderReceiptDialogProps {
  order: Order;
  counterpartyLabel: string;
  open: boolean;
  onClose: () => void;
}

export function OrderReceiptDialog({ order, counterpartyLabel, open, onClose }: OrderReceiptDialogProps) {
  const { t } = useTranslation();
  const receiptText = buildOrderReceiptText(order, counterpartyLabel);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: order.orderNumber, text: receiptText });
      return;
    }
    await navigator.clipboard.writeText(receiptText);
  };

  const handleDownload = () => {
    downloadTextFile(receiptText, `${order.orderNumber}-receipt.txt`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('orders.receiptTitle')}</DialogTitle>
          <DialogDescription>{order.orderNumber}</DialogDescription>
        </DialogHeader>

        <div className="rounded-[var(--radius-md)] border border-border-subtle p-4 space-y-3 text-sm font-mono whitespace-pre-wrap bg-surface-sunken">
          <p className="font-sans font-semibold">{counterpartyLabel}</p>
          <p className="font-sans text-text-secondary">{t('orders.status')}: {order.status}</p>
          <div className="space-y-2 font-sans">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-2">
                <span>{item.medicineName} × {item.quantity}</span>
                <span className="tabular-nums">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <p className="font-sans font-bold border-t border-border-subtle pt-2">
            {t('orders.total')}: {formatPrice(order.totalAmount)}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="secondary" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            {t('orders.downloadReceipt')}
          </Button>
          <Button onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            {t('orders.shareReceipt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
