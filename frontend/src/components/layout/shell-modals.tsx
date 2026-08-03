import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useShellStore } from '@/stores/shell-store';
import { useAuthStore } from '@/stores/auth-store';
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
import { Minus, Plus } from 'lucide-react';

function ComingSoonModal({
  open,
  onClose,
  titleKey,
  subKey,
}: {
  open: boolean;
  onClose: () => void;
  titleKey: string;
  subKey: string;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>
            {t(subKey)}
            <span className="block mt-1 text-text-disabled">{t('common.comingSoonDesc')}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    onClose();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('search.modalTitle')}</DialogTitle>
          <DialogDescription>{t('search.modalSub')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              className="pl-9"
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit">{t('common.search')}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BuyRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const ctx = useShellStore((s) => s.buyRequestContext);
  const addToCart = useAddToCart();
  const { toast: showToast } = useToast();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!ctx) return null;

  const total = ctx.finalPrice * quantity;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.post('/buy-requests', {
        sellerId: ctx.sellerId,
        listingIds: [{ listingId: ctx.listingId, quantity }],
        note: note || undefined,
      });
      showToast({ title: t('toast.success'), description: t('toast.buyRequestSent') });
      onClose();
      navigate('/buy-requests');
    } catch (e) {
      showToast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart.mutate(
      { listingId: ctx.listingId, quantity },
      {
        onSuccess: () => {
          showToast({ description: t('toast.addedToCart') });
          onClose();
        },
        onError: (e) => showToast({ title: t('toast.error'), description: e.message, variant: 'destructive' }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('buyRequest.modalTitle')}</DialogTitle>
          <DialogDescription>{ctx.medicineName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t('buyRequest.quantity')}</Label>
            <div className="flex items-center gap-2 border border-border-subtle rounded-[var(--radius-md)]">
              <button type="button" className="p-2" onClick={() => setQuantity(Math.max(ctx.moq, quantity - 1))}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center tabular-nums">{quantity}</span>
              <button type="button" className="p-2" onClick={() => setQuantity(Math.min(ctx.availableQty, quantity + 1))}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-sm font-medium tabular-nums">{t('buyRequest.total', { amount: formatPrice(total) })}</p>
          <div className="space-y-2">
            <Label htmlFor="br-note">{t('cart.note')}</Label>
            <Input id="br-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('cart.notePlaceholder')} />
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

function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('auth.authModalTitle')}</DialogTitle>
          <DialogDescription>{t('auth.authModalDesc')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={() => { onClose(); navigate('/login'); }}>{t('auth.signIn')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListingEditModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const listingId = useShellStore((s) => s.listingEditId);
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('seller.editListingModal')}</DialogTitle>
          <DialogDescription>{t('seller.editListingHint')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={() => { onClose(); if (listingId) navigate(`/seller/listing/${listingId}`); }}>
            {t('common.continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ShellModals() {
  const activeModal = useShellStore((s) => s.activeModal);
  const closeModal = useShellStore((s) => s.closeModal);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <>
      <SearchModal open={activeModal === 'search'} onClose={closeModal} />
      <BuyRequestModal open={activeModal === 'buyRequest' && isAuthenticated} onClose={closeModal} />
      <AuthModal open={activeModal === 'buyRequest' && !isAuthenticated} onClose={closeModal} />
      <ListingEditModal open={activeModal === 'listingEdit'} onClose={closeModal} />
      <ComingSoonModal open={activeModal === 'watchlist'} onClose={closeModal} titleKey="modal.watchlistTitle" subKey="modal.watchlistSub" />
      <ComingSoonModal open={activeModal === 'bulk'} onClose={closeModal} titleKey="modal.bulkTitle" subKey="modal.bulkSub" />
      <AuthModal open={activeModal === 'auth'} onClose={closeModal} />
    </>
  );
}
