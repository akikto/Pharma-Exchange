import { Link } from 'react-router-dom';
import { useState } from 'react';
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
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/verifications"><Button>Verification Queue</Button></Link>
          <Link to="/admin/reports"><Button variant="secondary">Reports</Button></Link>
          <Link to="/admin/users"><Button variant="secondary">Users</Button></Link>
          <Link to="/admin/analytics"><Button variant="secondary">Analytics</Button></Link>
        </div>
      </div>
    </div>
  );
}

export function AdminVerificationsPage() {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'verifications'],
    queryFn: () => apiClient.get<{ data: { id: string; name: string; city: string; verificationStatus: string }[] }>('/admin/verifications'),
  });

  const verify = useMutation({
    mutationFn: ({ id, action, rejectionReason }: { id: string; action: 'approve' | 'reject'; rejectionReason?: string }) =>
      apiClient.post(`/admin/verifications/${id}`, { action, rejectionReason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      setRejectId(null);
      setRejectReason('');
    },
  });

  return (
    <div className="min-h-screen bg-surface-raised">
      <TopBar title="Verifications" showBack />
      <div className="p-4 space-y-3 max-w-3xl mx-auto">
        {isLoading ? <ListSkeleton /> : data?.data.map((p) => (
          <div key={p.id} className="p-3 border border-border-subtle rounded-[var(--radius-md)] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-text-secondary">{p.city} · {p.verificationStatus}</p>
            </div>
            {p.verificationStatus === 'PENDING' && (
              rejectId === p.id ? (
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <input
                    className="text-sm border border-border-subtle rounded px-2 py-1"
                    placeholder="Rejection reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => verify.mutate({ id: p.id, action: 'reject', rejectionReason: rejectReason })}>Confirm Reject</Button>
                    <Button size="sm" variant="secondary" onClick={() => setRejectId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => setRejectId(p.id)}>Reject</Button>
                  <Button size="sm" onClick={() => verify.mutate({ id: p.id, action: 'approve' })}>Approve</Button>
                </div>
              )
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

export function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiClient.get<{ data: { id: string; firstName: string; lastName: string; email?: string; phone?: string; role: string; pharmacy?: { name: string; verificationStatus: string } }[] }>('/admin/users'),
  });

  return (
    <div className="min-h-screen bg-surface-raised">
      <TopBar title="User Management" showBack />
      <div className="p-4 space-y-3 max-w-3xl mx-auto">
        {isLoading ? <ListSkeleton /> : data?.data.map((u) => (
          <div key={u.id} className="p-3 border border-border-subtle rounded-[var(--radius-md)]">
            <p className="font-medium">{u.firstName} {u.lastName}</p>
            <p className="text-sm text-text-secondary">{u.email || u.phone} · {u.role}</p>
            {u.pharmacy && <p className="text-xs text-text-secondary">{u.pharmacy.name} — {u.pharmacy.verificationStatus}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => apiClient.get<{
      topMedicines: { medicineName: string; _sum: { quantity: number | null } }[];
      ordersOverTime: { date: string; count: number }[];
    }>('/admin/dashboard'),
  });

  return (
    <div className="min-h-screen bg-surface-raised">
      <TopBar title="Platform Analytics" showBack />
      <div className="p-4 space-y-6 max-w-3xl mx-auto">
        {isLoading ? <ListSkeleton /> : (
          <>
            <section>
              <h2 className="font-semibold mb-3">Top Medicines (30d)</h2>
              <div className="space-y-2">
                {data?.topMedicines?.map((m, i) => (
                  <div key={i} className="flex justify-between p-3 border border-border-subtle rounded-[var(--radius-md)] text-sm">
                    <span>{m.medicineName}</span>
                    <span className="tabular-nums font-medium">{m._sum.quantity ?? 0} units</span>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-semibold mb-3">Orders Over Time</h2>
              <div className="space-y-2">
                {(data?.ordersOverTime as { date: string; count: number }[] | undefined)?.map((row) => (
                  <div key={String(row.date)} className="flex justify-between p-3 border border-border-subtle rounded-[var(--radius-md)] text-sm">
                    <span>{new Date(row.date).toLocaleDateString()}</span>
                    <span className="font-medium">{row.count} orders</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
