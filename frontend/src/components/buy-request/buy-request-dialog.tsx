import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddToCart } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { BuyRequestModalContext } from '@/stores/shell-store';

interface BuyRequestDialogProps {
  open: boolean;
  onClose: () => void;
  context: BuyRequestModalContext | null;
  onSuccess?: (requestId: string) => void;
}

export function BuyRequestDialog({ open, onClose, context, onSuccess }: BuyRequestDialogProps) {
  const { t } = useTranslation();
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (context) setQuantity(context.moq);
  }, [context?.listingId, context?.moq]);

  if (!context) return null;

  const total = context.finalPrice * quantity;

  const resetAndClose = () => {
    setQuantity(context.moq);
    setNote('');
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await apiClient.post<{ id: string }>('/buy-requests', {
        sellerId: context.sellerId,
        listingIds: [{ listingId: context.listingId, quantity }],
        note: note.trim() || undefined,
      });
      toast({ title: t('toast.success'), description: t('toast.buyRequestSent') });
      resetAndClose();
      onSuccess?.(result.id);
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart.mutate(
      { listingId: context.listingId, quantity },
      {
        onSuccess: () => {
          toast({ description: t('toast.addedToCart') });
          resetAndClose();
        },
        onError: (e) => toast({ title: t('toast.error'), description: e.message, variant: 'destructive' }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('buyRequest.modalTitle')}</DialogTitle>
          <DialogDescription>
            {context.medicineName}
            <span className="block text-[10px] text-text-disabled">{t('buyRequest.modalSub')}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t('buyRequest.quantity')}</Label>
            <div className="flex items-center gap-2 border border-border-subtle rounded-[var(--radius-md)]">
              <button type="button" className="p-2 min-h-[44px] min-w-[44px]" onClick={() => setQuantity(Math.max(context.moq, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center tabular-nums">{quantity}</span>
              <button type="button" className="p-2 min-h-[44px] min-w-[44px]" onClick={() => setQuantity(Math.min(context.availableQty, quantity + 1))}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-sm font-medium tabular-nums">{t('buyRequest.total', { amount: formatPrice(total) })}</p>
          <div className="space-y-2">
            <Label htmlFor="br-dialog-note">{t('cart.note')}</Label>
            <Input id="br-dialog-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('cart.notePlaceholder')} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="secondary" onClick={handleAddToCart} loading={addToCart.isPending}>
            {t('listing.addToCart')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {t('buyRequest.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
