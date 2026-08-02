import { Link } from 'react-router-dom';
import { Plus, Package, Inbox, TrendingUp, AlertTriangle, Pause, Play, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { brand } from '@/config/brand';
import { useSellerAnalytics, useBuyRequests, useSellerInventory } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function SellerDashboardPage() {
  const { data: analytics, isLoading, isError } = useSellerAnalytics();
  const { data: requests } = useBuyRequests('seller');

  if (isLoading) return <div className="p-4"><ListSkeleton count={3} /></div>;
  if (isError) return <div className="p-4 text-center text-danger">Failed to load dashboard</div>;

  return (
    <div>
      <TopBar title={`${brand.name} Seller`} />
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Sales (30d)</p><p className="text-lg font-bold tabular-nums">{formatPrice(analytics?.todaySales ?? 0)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Pending Requests</p><p className="text-lg font-bold">{analytics?.pendingBuyRequests ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Active Listings</p><p className="text-lg font-bold">{analytics?.activeListings ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Rating</p><p className="text-lg font-bold">⭐ {analytics?.rating?.toFixed(1) ?? '0'}</p></CardContent></Card>
        </div>

        {(analytics?.shortExpiryAlert ?? 0) > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div className="flex-1"><p className="text-sm font-medium">{analytics?.shortExpiryAlert} listings expiring soon</p></div>
            <Link to="/seller/inventory"><Button size="sm" variant="secondary">View</Button></Link>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Pending Buy Requests</h2>
            <Link to="/seller/requests" className="text-sm text-primary">View all</Link>
          </div>
          {requests?.data.length === 0 ? (
            <p className="text-sm text-text-secondary">No pending requests</p>
          ) : (
            requests?.data.slice(0, 3).map((req) => (
              <Link key={req.id} to={`/seller/requests/${req.id}`} className="block p-3 mb-2 rounded-[var(--radius-md)] border border-border-subtle">
                <div className="flex justify-between"><span className="font-medium text-sm">{req.requestNumber}</span><StatusChip label={req.status} variant="warning" /></div>
                <p className="text-sm text-text-secondary mt-1">{formatPrice(req.totalAmount)} · {req.items.length} items</p>
              </Link>
            ))
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/seller/listing/new"><Button className="w-full" size="lg"><Plus className="h-4 w-4" /> Add Listing</Button></Link>
          <Link to="/seller/inventory"><Button variant="secondary" className="w-full" size="lg"><Package className="h-4 w-4" /> Inventory</Button></Link>
          <Link to="/seller/orders"><Button variant="secondary" className="w-full"><Inbox className="h-4 w-4" /> Orders</Button></Link>
          <Link to="/seller/analytics"><Button variant="secondary" className="w-full"><TrendingUp className="h-4 w-4" /> Analytics</Button></Link>
        </div>
      </div>
    </div>
  );
}

export function SellerInventoryPage() {
  const { data, isLoading, isError } = useSellerInventory();
  const qc = useQueryClient();
  const listings = data?.data ?? [];

  const toggleListing = async (id: string, action: 'pause' | 'activate') => {
    await apiClient.post(`/listings/${id}/${action}`);
    qc.invalidateQueries({ queryKey: ['seller-inventory'] });
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await apiClient.delete(`/listings/${id}`);
    qc.invalidateQueries({ queryKey: ['seller-inventory'] });
  };

  return (
    <div>
      <TopBar title="Inventory" showBack actions={<Link to="/seller/listing/new"><Button size="sm"><Plus className="h-4 w-4" /></Button></Link>} />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : isError ? (
          <p className="text-center text-danger py-12">Failed to load inventory</p>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">No listings yet</p>
            <Link to="/seller/listing/new"><Button className="mt-4">Add Your First Listing</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="flex gap-3 p-3 rounded-[var(--radius-md)] border border-border-subtle">
                <Link to={`/seller/listing/${l.id}`} className="flex gap-3 flex-1 min-w-0">
                  <div className="h-14 w-14 rounded bg-surface-sunken flex items-center justify-center shrink-0">💊</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{l.medicine.name}</p>
                    <p className="text-xs text-text-secondary">{formatPrice(l.finalPrice)} · Qty {l.availableQty}</p>
                    <StatusChip label={l.status} variant={l.status === 'ACTIVE' ? 'success' : 'neutral'} className="mt-1" />
                  </div>
                </Link>
                <div className="flex flex-col gap-1">
                  {l.status === 'ACTIVE' ? (
                    <button className="p-2 text-text-secondary hover:text-warning" aria-label="Pause listing" onClick={() => toggleListing(l.id, 'pause')}><Pause className="h-4 w-4" /></button>
                  ) : (
                    <button className="p-2 text-text-secondary hover:text-success" aria-label="Activate listing" onClick={() => toggleListing(l.id, 'activate')}><Play className="h-4 w-4" /></button>
                  )}
                  <button className="p-2 text-text-secondary hover:text-danger" aria-label="Delete listing" onClick={() => deleteListing(l.id)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
