import { Link } from 'react-router-dom';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent } from '@/components/ui/card';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useSellerAnalytics } from '@/hooks/use-api';
import { formatPrice } from '@/lib/utils';

export function SellerAnalyticsPage() {
  const { data, isLoading, isError } = useSellerAnalytics();

  if (isLoading) return <div className="p-4"><ListSkeleton count={4} /></div>;
  if (isError) return <div className="p-4 text-center text-danger">Failed to load analytics</div>;

  return (
    <div>
      <TopBar title="Analytics" showBack />
      <div className="p-4 grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Sales (30d)</p><p className="text-lg font-bold tabular-nums">{formatPrice(data?.todaySales ?? 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Orders (30d)</p><p className="text-lg font-bold">{data?.orderCount ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Active Listings</p><p className="text-lg font-bold">{data?.activeListings ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Pending Requests</p><p className="text-lg font-bold">{data?.pendingBuyRequests ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Rating</p><p className="text-lg font-bold">⭐ {data?.rating?.toFixed(1) ?? '0'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Expiring Soon</p><p className="text-lg font-bold text-warning">{data?.shortExpiryAlert ?? 0}</p></CardContent></Card>
      </div>

      {data?.recentOrders && data.recentOrders.length > 0 && (
        <div className="p-4">
          <h2 className="font-semibold mb-3">Recent Orders</h2>
          <div className="space-y-2">
            {data.recentOrders.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="block p-3 rounded-[var(--radius-md)] border border-border-subtle">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{o.orderNumber}</span>
                  <span>{formatPrice(o.totalAmount)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
