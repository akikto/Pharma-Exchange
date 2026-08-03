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
import { BuyRequestDialog } from '@/components/buy-request/buy-request-dialog';
import { BulkProcurementDialog } from '@/components/bulk/bulk-procurement-dialog';

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
  const ctx = useShellStore((s) => s.buyRequestContext);
  const navigate = useNavigate();

  return (
    <BuyRequestDialog
      open={open}
      onClose={onClose}
      context={ctx}
      onSuccess={(requestId) => navigate(`/buy-requests/${requestId}`)}
    />
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

function BulkSellerRequiredModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('bulk.sellerRequiredTitle')}</DialogTitle>
          <DialogDescription>{t('bulk.sellerRequiredDesc')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={() => { onClose(); navigate('/pharmacy/register'); }}>{t('inventory.registerPharmacyCta')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <BulkProcurementDialog
      open={open}
      onClose={onClose}
      defaultPhone={user?.phone ?? ''}
      onSuccess={() => navigate('/seller/inventory')}
    />
  );
}

export function ShellModals() {
  const activeModal = useShellStore((s) => s.activeModal);
  const closeModal = useShellStore((s) => s.closeModal);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isVerifiedSeller = user?.pharmacy?.verificationStatus === 'APPROVED';

  return (
    <>
      <SearchModal open={activeModal === 'search'} onClose={closeModal} />
      <BuyRequestModal open={activeModal === 'buyRequest' && isAuthenticated} onClose={closeModal} />
      <AuthModal open={activeModal === 'buyRequest' && !isAuthenticated} onClose={closeModal} />
      <ListingEditModal open={activeModal === 'listingEdit'} onClose={closeModal} />
      <BulkModal open={activeModal === 'bulk' && isAuthenticated && isVerifiedSeller} onClose={closeModal} />
      <AuthModal open={activeModal === 'bulk' && !isAuthenticated} onClose={closeModal} />
      <BulkSellerRequiredModal open={activeModal === 'bulk' && isAuthenticated && !isVerifiedSeller} onClose={closeModal} />
      <AuthModal open={activeModal === 'auth'} onClose={closeModal} />
    </>
  );
}
