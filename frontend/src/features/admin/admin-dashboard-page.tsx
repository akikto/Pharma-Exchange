import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => apiClient.get<{
      gmv: number; activePharmacies: number; pendingVerifications: number;
      openReports: number; totalOrders: number; activeListings: number;
    }>('/admin/dashboard'),
  });

  if (isLoading) return <div className="p-4"><ListSkeleton count={4} /></div>;
  if (isError) return <div className="p-4 text-center text-danger">Failed to load dashboard</div>;

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
        <div className="flex gap-3">
          <Link to="/admin/verifications"><Button>Verification Queue</Button></Link>
          <Link to="/admin/reports"><Button variant="secondary">Reports</Button></Link>
        </div>
      </div>
    </div>
  );
}

export function AdminVerificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'verifications'],
    queryFn: () => apiClient.get<{ data: { id: string; name: string; city: string; verificationStatus: string }[] }>('/admin/verifications'),
  });

  const verify = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      apiClient.post(`/admin/verifications/${id}`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'verifications'] }),
  });

  return (
    <div className="min-h-screen bg-surface-raised">
      <TopBar title="Verifications" showBack />
      <div className="p-4 space-y-3 max-w-3xl mx-auto">
        {isLoading ? <ListSkeleton /> : data?.data.map((p) => (
          <div key={p.id} className="p-3 border border-border-subtle rounded-[var(--radius-md)] flex justify-between items-center">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-text-secondary">{p.city} · {p.verificationStatus}</p>
            </div>
            {p.verificationStatus === 'PENDING' && (
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => verify.mutate({ id: p.id, action: 'reject' })}>Reject</Button>
                <Button size="sm" onClick={() => verify.mutate({ id: p.id, action: 'approve' })}>Approve</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminReportsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => apiClient.get<{ data: { id: string; reason: string; status: string; targetType: string }[] }>('/admin/reports'),
  });

  const resolve = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/reports/${id}/resolve`, { status: 'RESOLVED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  return (
    <div className="min-h-screen bg-surface-raised">
      <TopBar title="Reports" showBack />
      <div className="p-4 space-y-3 max-w-3xl mx-auto">
        {isLoading ? <ListSkeleton /> : data?.data.length === 0 ? (
          <p className="text-center text-text-secondary py-12">No open reports</p>
        ) : data?.data.map((r) => (
          <div key={r.id} className="p-3 border border-border-subtle rounded-[var(--radius-md)] flex justify-between items-center">
            <div>
              <p className="font-medium">{r.reason}</p>
              <p className="text-sm text-text-secondary">{r.targetType} · {r.status}</p>
            </div>
            {r.status === 'OPEN' && (
              <Button size="sm" onClick={() => resolve.mutate(r.id)}>Resolve</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
