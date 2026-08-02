import { useQuery } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent } from '@/components/ui/card';
import { ListSkeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => apiClient.get<{
      gmv: number; activePharmacies: number; pendingVerifications: number;
      openReports: number; totalOrders: number; activeListings: number;
    }>('/admin/dashboard'),
  });

  if (isLoading) return <div className="p-4"><ListSkeleton count={4} /></div>;

  return (
    <div className="min-h-screen bg-surface-raised">
      <TopBar title="Admin Dashboard" />
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">GMV (30d)</p><p className="text-xl font-bold tabular-nums">{formatPrice(data?.gmv ?? 0)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Active Pharmacies</p><p className="text-xl font-bold">{data?.activePharmacies ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Pending Verifications</p><p className="text-xl font-bold text-warning">{data?.pendingVerifications ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Open Reports</p><p className="text-xl font-bold text-danger">{data?.openReports ?? 0}</p></CardContent></Card>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Total Orders (30d)</p><p className="text-xl font-bold">{data?.totalOrders ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-text-secondary">Active Listings</p><p className="text-xl font-bold">{data?.activeListings ?? 0}</p></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
