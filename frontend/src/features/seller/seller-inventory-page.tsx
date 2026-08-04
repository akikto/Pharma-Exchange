import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Download, Share2, Pause, Play, PackageX, Trash2, PackagePlus, AlertTriangle, Check,
} from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  useSellerInventory,
  useInventoryStats,
  usePauseListing,
  useActivateListing,
  useMarkSoldOut,
  useDeleteListing,
  useRestockListing,
  useExportInventory,
  useUpdateListingPrice,
  useUpdateListingQuantity,
} from '@/hooks/use-api';
import { useShellStore } from '@/stores/shell-store';
import { formatPrice } from '@/lib/utils';
import { inventoryExportFilename, isListingLowStock, type InventoryTab } from '@/lib/inventory-utils';
import { downloadCsv, shareTextFile } from '@/lib/download-utils';
import type { Listing } from '@/types';

const TABS: InventoryTab[] = ['ACTIVE', 'PAUSED', 'SOLD_OUT', 'LOW_STOCK'];

export function SellerInventoryPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const openModal = useShellStore((s) => s.openModal);
  const [tab, setTab] = useState<InventoryTab>('ACTIVE');
  const [search, setSearch] = useState('');
  const { data: stats } = useInventoryStats();
  const { data, isLoading, isError } = useSellerInventory(tab, search);
  const pauseListing = usePauseListing();
  const activateListing = useActivateListing();
  const markSoldOut = useMarkSoldOut();
  const deleteListing = useDeleteListing();
  const restockListing = useRestockListing();
  const updatePrice = useUpdateListingPrice();
  const updateQuantity = useUpdateListingQuantity();
  const exportInventory = useExportInventory();

  const listings = data?.data ?? [];

  const statChips: { key: InventoryTab; count: number }[] = [
    { key: 'ACTIVE', count: stats?.active ?? 0 },
    { key: 'PAUSED', count: stats?.paused ?? 0 },
    { key: 'SOLD_OUT', count: stats?.soldOut ?? 0 },
    { key: 'LOW_STOCK', count: stats?.lowStock ?? 0 },
  ];

  const handleExport = async () => {
    try {
      const csv = await exportInventory.mutateAsync();
      downloadCsv(csv, inventoryExportFilename());
      toast({ description: t('inventory.exportSuccess') });
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    try {
      const csv = await exportInventory.mutateAsync();
      const filename = inventoryExportFilename();
      const result = await shareTextFile(csv, filename, {
        title: t('inventory.exportTitle'),
        mimeType: 'text/csv;charset=utf-8',
      });
      if (result === 'clipboard') {
        toast({ description: t('inventory.shareCopied') });
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
      }
    }
  };

  const runAction = async (action: () => Promise<unknown>, successKey: string) => {
    try {
      await action();
      toast({ description: t(successKey) });
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  const statusVariant = (listing: Listing) => {
    if (isListingLowStock(listing)) return 'warning' as const;
    if (listing.status === 'ACTIVE') return 'success' as const;
    if (listing.status === 'SOLD_OUT') return 'danger' as const;
    return 'neutral' as const;
  };

  return (
    <div>
      <TopBar
        title={t('seller.inventoryTitle')}
        showBack
        actions={(
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleShare} disabled={exportInventory.isPending} aria-label={t('inventory.share')}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExport} disabled={exportInventory.isPending} aria-label={t('inventory.export')}>
              <Download className="h-4 w-4" />
            </Button>
            <Link to="/seller/listing/new">
              <Button size="sm"><Plus className="h-4 w-4" /></Button>
            </Link>
          </div>
        )}
      />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statChips.map(({ key, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-[var(--radius-md)] border p-3 text-left transition-colors ${
                tab === key ? 'border-primary bg-primary-subtle' : 'border-border-subtle bg-surface-raised'
              }`}
              data-testid={`inventory-stat-${key}`}
            >
              <p className="text-[10px] text-text-secondary">{t(`inventory.stat.${key}`)}</p>
              <p className="text-lg font-bold tabular-nums">{count}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border ${
                tab === key ? 'bg-primary text-on-primary border-primary' : 'border-border-subtle text-text-secondary'
              }`}
            >
              {t(`inventory.tab.${key}`)}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('inventory.searchPlaceholder')}
            className="pl-9"
            data-testid="inventory-search"
          />
        </div>

        {isLoading ? <ListSkeleton /> : isError ? (
          <p className="text-center text-danger py-12">{t('seller.loadError')}</p>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">{t('seller.noListings')}</p>
            <Link to="/seller/listing/new"><Button className="mt-4">{t('seller.addFirst')}</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <InventoryRow
                key={l.id}
                listing={l}
                statusVariant={statusVariant(l)}
                onEdit={() => openModal('listingEdit', { listingId: l.id })}
                onPause={() => runAction(() => pauseListing.mutateAsync(l.id), 'inventory.paused')}
                onActivate={() => runAction(() => activateListing.mutateAsync(l.id), 'inventory.activated')}
                onSoldOut={() => runAction(() => markSoldOut.mutateAsync(l.id), 'inventory.soldOut')}
                onDelete={() => runAction(() => deleteListing.mutateAsync(l.id), 'inventory.deleted')}
                onRestock={() => runAction(() => restockListing.mutateAsync({ id: l.id }), 'inventory.restocked')}
                onUpdatePrice={(sellingPrice) => runAction(
                  () => updatePrice.mutateAsync({ id: l.id, sellingPrice }),
                  'inventory.priceUpdated',
                )}
                onUpdateDiscount={(discountPercent) => runAction(
                  () => updatePrice.mutateAsync({ id: l.id, discountPercent }),
                  'inventory.discountUpdated',
                )}
                onUpdateQty={(availableQty) => runAction(
                  () => updateQuantity.mutateAsync({ id: l.id, availableQty }),
                  'inventory.qtyUpdated',
                )}
                isUpdating={updatePrice.isPending || updateQuantity.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface InventoryRowProps {
  listing: Listing;
  statusVariant: 'success' | 'warning' | 'danger' | 'neutral';
  onEdit: () => void;
  onPause: () => void;
  onActivate: () => void;
  onSoldOut: () => void;
  onDelete: () => void;
  onRestock: () => void;
  onUpdatePrice: (sellingPrice: number) => void;
  onUpdateDiscount: (discountPercent: number) => void;
  onUpdateQty: (availableQty: number) => void;
  isUpdating?: boolean;
}

function InventoryRow({
  listing: l, statusVariant, onEdit, onPause, onActivate, onSoldOut, onDelete, onRestock,
  onUpdatePrice, onUpdateDiscount, onUpdateQty, isUpdating,
}: InventoryRowProps) {
  const { t } = useTranslation();
  const lowStock = isListingLowStock(l);
  const [price, setPrice] = useState(String(l.sellingPrice));
  const [discount, setDiscount] = useState(String(l.discountPercent));
  const [qty, setQty] = useState(String(l.availableQty));

  const savePrice = () => {
    const value = Number(price);
    if (value > 0) onUpdatePrice(value);
  };

  const saveDiscount = () => {
    const value = Number(discount);
    if (value >= 0 && value <= 100) onUpdateDiscount(value);
  };

  const saveQty = () => {
    const value = Number(qty);
    if (value > 0) onUpdateQty(value);
  };

  return (
    <div
      className={`rounded-[var(--radius-md)] border p-3 ${
        lowStock ? 'border-warning/40 bg-warning/5' : 'border-border-subtle'
      }`}
      data-testid={`inventory-row-${l.id}`}
    >
      <button type="button" className="flex w-full gap-3 text-left" onClick={onEdit}>
        <div className="h-14 w-14 rounded bg-surface-sunken flex items-center justify-center shrink-0">💊</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{l.medicine.name}</p>
          <p className="text-xs text-text-secondary truncate">
            {l.medicine.genericName ?? l.medicine.company} · {t('inventory.batch', { batch: l.batchNumber })}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {formatPrice(l.finalPrice)} · {t('inventory.qty', { qty: l.availableQty })}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusChip label={l.status} variant={statusVariant} />
            {lowStock && (
              <span className="inline-flex items-center gap-1 text-[10px] text-warning">
                <AlertTriangle className="h-3 w-3" />
                {t('inventory.lowStock')}
              </span>
            )}
          </div>
        </div>
      </button>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border-subtle" data-testid={`inventory-inline-${l.id}`}>
        <div>
          <label className="text-[10px] text-text-secondary">{t('inventory.inlinePrice')}</label>
          <div className="flex gap-1 mt-1">
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-8 text-xs" />
            <Button size="sm" variant="secondary" className="h-8 px-2" onClick={savePrice} disabled={isUpdating} aria-label={t('inventory.update')}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-secondary">{t('inventory.inlineDiscount')}</label>
          <div className="flex gap-1 mt-1">
            <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="h-8 text-xs" />
            <Button size="sm" variant="secondary" className="h-8 px-2" onClick={saveDiscount} disabled={isUpdating} aria-label={t('inventory.update')}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-secondary">{t('inventory.inlineQty')}</label>
          <div className="flex gap-1 mt-1">
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="h-8 text-xs" />
            <Button size="sm" variant="secondary" className="h-8 px-2" onClick={saveQty} disabled={isUpdating} aria-label={t('inventory.update')}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border-subtle">
        {l.status === 'ACTIVE' ? (
          <Button size="sm" variant="secondary" onClick={onPause}>
            <Pause className="h-3.5 w-3.5" /> {t('inventory.pause')}
          </Button>
        ) : l.status === 'PAUSED' ? (
          <Button size="sm" variant="secondary" onClick={onActivate}>
            <Play className="h-3.5 w-3.5" /> {t('inventory.resume')}
          </Button>
        ) : null}
        {l.status !== 'SOLD_OUT' && (
          <Button size="sm" variant="secondary" onClick={onSoldOut}>
            <PackageX className="h-3.5 w-3.5" /> {t('inventory.markSoldOut')}
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={onRestock}>
          <PackagePlus className="h-3.5 w-3.5" /> {t('inventory.restock')}
        </Button>
        <Button size="sm" variant="tertiary" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" /> {t('inventory.remove')}
        </Button>
      </div>
    </div>
  );
}
