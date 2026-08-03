import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useBuyRequests } from '@/hooks/use-api';
import { useHubRole } from '@/hooks/use-hub-role';
import { type BuyRequestFilter, filterBuyRequests } from '@/lib/order-utils';
import { formatPrice } from '@/lib/utils';

const REQUEST_FILTERS: BuyRequestFilter[] = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

export function BuyRequestsTabPanel() {
  const { t } = useTranslation();
  const role = useHubRole();
  const { data, isLoading, isError } = useBuyRequests(role);
  const [filter, setFilter] = useState<BuyRequestFilter>('ALL');
  const [query, setQuery] = useState('');

  const basePath = role === 'seller' ? '/seller/requests' : '/buy-requests';
  const requests = data?.data ?? [];
  const filtered = filterBuyRequests(requests, filter, query);

  if (isLoading) return <ListSkeleton />;
  if (isError) return <p className="text-center text-danger py-12">{t('buyRequest.loadError')}</p>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        <Input
          className="pl-9"
          placeholder={t('buyRequest.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {REQUEST_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border min-h-[36px] ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border-subtle'
            }`}
          >
            {t(`buyRequest.filter.${f.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-text-secondary py-12">
          {role === 'seller' ? t('seller.noPending') : t('buyRequest.noSent')}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <Link
              key={req.id}
              to={`${basePath}/${req.id}`}
              className="block p-3 rounded-[var(--radius-md)] border border-border-subtle"
            >
              <div className="flex justify-between">
                <span className="font-medium text-sm">{req.requestNumber}</span>
                <StatusChip
                  label={req.status}
                  variant={req.status === 'ACCEPTED' ? 'success' : req.status === 'REJECTED' ? 'danger' : 'warning'}
                />
              </div>
              <p className="text-sm text-text-secondary mt-1">
                {role === 'seller'
                  ? `${req.buyer?.firstName} ${req.buyer?.lastName}`
                  : req.seller?.name}{' '}
                · {formatPrice(req.totalAmount)}
              </p>
              <p className="text-xs text-text-disabled">{new Date(req.createdAt).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
