import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';
import type { Listing, Medicine } from '@/types';

export function ListingFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [medicineQuery, setMedicineQuery] = useState('');
  const [error, setError] = useState('');

  const { data: existing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => apiClient.get<Listing>(`/listings/${id}`),
    enabled: isEdit,
  });

  const { data: medicines } = useQuery({
    queryKey: ['medicines', medicineQuery],
    queryFn: () => apiClient.get<{ data: Medicine[] }>(`/medicines?q=${medicineQuery}&limit=10`),
    enabled: medicineQuery.length >= 2,
  });

  const [form, setForm] = useState({
    medicineId: '',
    batchNumber: '',
    mfgDate: '',
    expiryDate: '',
    purchasePrice: '',
    sellingPrice: '',
    discountPercent: '0',
    availableQty: '',
    moq: '1',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        medicineId: existing.medicine.id,
        batchNumber: existing.batchNumber,
        mfgDate: existing.mfgDate.slice(0, 10),
        expiryDate: existing.expiryDate.slice(0, 10),
        purchasePrice: String(existing.sellingPrice),
        sellingPrice: String(existing.sellingPrice),
        discountPercent: String(existing.discountPercent),
        availableQty: String(existing.availableQty),
        moq: String(existing.moq),
        status: existing.status,
      });
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        medicineId: form.medicineId,
        batchNumber: form.batchNumber,
        mfgDate: new Date(form.mfgDate).toISOString(),
        expiryDate: new Date(form.expiryDate).toISOString(),
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        discountPercent: Number(form.discountPercent),
        availableQty: Number(form.availableQty),
        moq: Number(form.moq),
        status: form.status,
      };
      if (isEdit) return apiClient.patch(`/listings/${id}`, body);
      return apiClient.post('/listings', body);
    },
    onSuccess: () => navigate('/seller/inventory'),
    onError: (e) => setError((e as Error).message),
  });

  if (isEdit && isLoading) return <div className="p-4"><ListSkeleton /></div>;

  return (
    <div>
      <TopBar title={isEdit ? 'Edit Listing' : 'Add Listing'} showBack />
      <form className="p-4 space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        {!isEdit && (
          <div>
            <Label>Search Medicine</Label>
            <Input value={medicineQuery} onChange={(e) => setMedicineQuery(e.target.value)} placeholder="Type medicine name..." />
            {medicines?.data && (
              <div className="mt-2 border border-border-subtle rounded-[var(--radius-md)] max-h-40 overflow-y-auto">
                {medicines.data.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="w-full text-left p-2 text-sm hover:bg-surface-raised"
                    onClick={() => { setForm((f) => ({ ...f, medicineId: m.id })); setMedicineQuery(m.name); }}
                  >
                    {m.name} — {m.company}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div><Label>Batch Number</Label><Input value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Mfg Date</Label><Input type="date" value={form.mfgDate} onChange={(e) => setForm({ ...form, mfgDate: e.target.value })} required /></div>
          <div><Label>Expiry Date</Label><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Purchase Price</Label><Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required /></div>
          <div><Label>Selling Price</Label><Input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Discount %</Label><Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} /></div>
          <div><Label>Available Qty</Label><Input type="number" value={form.availableQty} onChange={(e) => setForm({ ...form, availableQty: e.target.value })} required /></div>
        </div>
        <div><Label>MOQ</Label><Input type="number" value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} required /></div>

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" loading={save.isPending}>
          {isEdit ? 'Update Listing' : 'Create Listing'}
        </Button>
      </form>
    </div>
  );
}
