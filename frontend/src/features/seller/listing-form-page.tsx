import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';
import { getErrorMessage } from '@/lib/api-errors';
import {
  clearListingDraft,
  isListingDraftEmpty,
  loadListingDraft,
  saveListingDraft,
  type ListingDraft,
} from '@/lib/listing-draft';
import type { Listing, Medicine } from '@/types';

const EMPTY_FORM: Omit<ListingDraft, 'updatedAt'> = {
  medicineId: '',
  medicineQuery: '',
  batchNumber: '',
  mfgDate: '',
  expiryDate: '',
  purchasePrice: '',
  sellingPrice: '',
  discountPercent: '0',
  availableQty: '',
  moq: '1',
  lowStockThreshold: '',
};

export function ListingFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [medicineQuery, setMedicineQuery] = useState('');
  const [error, setError] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showMedicineResults, setShowMedicineResults] = useState(false);
  const saveDraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const medicineSearchRef = useRef<HTMLInputElement>(null);

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

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (existing) {
      setForm({
        medicineId: existing.medicine.id,
        medicineQuery: existing.medicine.name,
        batchNumber: existing.batchNumber,
        mfgDate: existing.mfgDate.slice(0, 10),
        expiryDate: existing.expiryDate.slice(0, 10),
        purchasePrice: String(existing.sellingPrice),
        sellingPrice: String(existing.sellingPrice),
        discountPercent: String(existing.discountPercent),
        availableQty: String(existing.availableQty),
        moq: String(existing.moq),
        lowStockThreshold: existing.lowStockThreshold != null ? String(existing.lowStockThreshold) : '',
      });
      setMedicineQuery(existing.medicine.name);
    }
  }, [existing]);

  useEffect(() => {
    if (isEdit || draftLoaded) return;
    void loadListingDraft().then((draft) => {
      if (draft && !isListingDraftEmpty(draft)) {
        setForm({
          medicineId: draft.medicineId,
          medicineQuery: draft.medicineQuery,
          batchNumber: draft.batchNumber,
          mfgDate: draft.mfgDate,
          expiryDate: draft.expiryDate,
          purchasePrice: draft.purchasePrice,
          sellingPrice: draft.sellingPrice,
          discountPercent: draft.discountPercent,
          availableQty: draft.availableQty,
          moq: draft.moq,
          lowStockThreshold: draft.lowStockThreshold,
        });
        setMedicineQuery(draft.medicineQuery);
      }
      setDraftLoaded(true);
    });
  }, [isEdit, draftLoaded]);

  useEffect(() => {
    if (isEdit || !draftLoaded) return;
    if (saveDraftTimer.current) clearTimeout(saveDraftTimer.current);
    saveDraftTimer.current = setTimeout(() => {
      const draft = { ...form, medicineQuery, updatedAt: new Date().toISOString() };
      if (isListingDraftEmpty(draft)) {
        void clearListingDraft();
      } else {
        void saveListingDraft(draft);
      }
    }, 500);
    return () => {
      if (saveDraftTimer.current) clearTimeout(saveDraftTimer.current);
    };
  }, [form, medicineQuery, isEdit, draftLoaded]);

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
        ...(form.lowStockThreshold ? { lowStockThreshold: Number(form.lowStockThreshold) } : {}),
        status: 'ACTIVE',
      };
      if (isEdit) return apiClient.patch(`/listings/${id}`, body);
      return apiClient.post('/listings', body);
    },
    onSuccess: async () => {
      if (!isEdit) await clearListingDraft();
      navigate('/seller/inventory');
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  const promptMedicineSelection = () => {
    setError(t('listing.medicineRequired'));
    setShowMedicineResults(true);
    medicineSearchRef.current?.focus();
  };

  const handleMedicineQueryChange = (value: string) => {
    setMedicineQuery(value);
    setForm((f) => ({ ...f, medicineId: '', medicineQuery: value }));
    setError('');
    setShowMedicineResults(value.length >= 2);
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    setForm((f) => ({ ...f, medicineId: medicine.id, medicineQuery: medicine.name }));
    setMedicineQuery(medicine.name);
    setError('');
    setShowMedicineResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !form.medicineId) {
      promptMedicineSelection();
      return;
    }
    setError('');
    save.mutate();
  };

  const clearDraft = async () => {
    await clearListingDraft();
    setForm(EMPTY_FORM);
    setMedicineQuery('');
    setShowMedicineResults(false);
  };

  if (isEdit && isLoading) return <div className="p-4"><ListSkeleton /></div>;

  const hasDraft = !isEdit && draftLoaded && !isListingDraftEmpty({ ...form, medicineQuery, updatedAt: '' });
  const canShowMedicineResults = !isEdit && medicineQuery.length >= 2 && (showMedicineResults || Boolean(medicines?.data));

  return (
    <div>
      <TopBar title={isEdit ? 'Edit Listing' : 'Add Listing'} showBack />
      <form className="p-4 space-y-4" onSubmit={handleSubmit}>
        {!isEdit && hasDraft && (
          <div className="rounded-[var(--radius-md)] border border-primary/30 bg-primary-subtle/30 p-3 flex items-center justify-between gap-3">
            <p className="text-sm">{t('listing.draftRestored')}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => void clearDraft()}>
              {t('listing.clearDraft')}
            </Button>
          </div>
        )}

        {!isEdit && (
          <div>
            <Label>Search Medicine</Label>
            <Input
              ref={medicineSearchRef}
              value={medicineQuery}
              onChange={(e) => handleMedicineQueryChange(e.target.value)}
              placeholder="Type medicine name..."
              data-testid="medicine-search-input"
            />
            {canShowMedicineResults && (
              <div
                className="mt-2 border border-border-subtle rounded-[var(--radius-md)] max-h-40 overflow-y-auto"
                data-testid="medicine-search-results"
              >
                {medicines?.data?.length ? (
                  medicines.data.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="w-full text-left p-2 text-sm hover:bg-surface-raised"
                      onClick={() => handleMedicineSelect(m)}
                    >
                      {m.name} — {m.company}
                    </button>
                  ))
                ) : (
                  <p className="p-2 text-sm text-text-secondary">No medicines found. Try another search.</p>
                )}
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
        <div><Label>Low Stock Threshold (optional)</Label><Input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} placeholder="Default: max(MOQ×2, 20)" /></div>

        {error && <p className="text-sm text-danger" data-testid="listing-form-error">{error}</p>}
        <Button type="submit" className="w-full" loading={save.isPending}>
          {isEdit ? 'Update Listing' : 'Create Listing'}
        </Button>
      </form>
    </div>
  );
}
