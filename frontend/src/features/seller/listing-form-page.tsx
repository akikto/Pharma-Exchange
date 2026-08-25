import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/ui/skeleton';
import { MedicineInfoPanel } from '@/components/medicine/medicine-info-panel';
import { MedicineNameAutocomplete } from '@/components/medicine/medicine-name-autocomplete';
import { MedicineImageUpload } from '@/components/medicine/medicine-image-upload';
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
  imageUrl: '',
};

export function ListingFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [medicineQuery, setMedicineQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [error, setError] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const saveDraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const medicineSearchRef = useRef<HTMLInputElement>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => apiClient.get<Listing>(`/listings/${id}`),
    enabled: isEdit,
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
        imageUrl: existing.imageUrl ?? existing.medicine.imageUrl ?? '',
      });
      setMedicineQuery(existing.medicine.name);
      setSelectedMedicine(existing.medicine);
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
          imageUrl: draft.imageUrl ?? '',
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
    medicineSearchRef.current?.focus();
  };

  const handleMedicineQueryChange = (value: string) => {
    setMedicineQuery(value);
    setForm((f) => ({ ...f, medicineId: '', medicineQuery: value }));
    setSelectedMedicine(null);
    setError('');
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    setForm((f) => ({
      ...f,
      medicineId: medicine.id,
      medicineQuery: medicine.name,
      imageUrl: f.imageUrl || medicine.imageUrl || '',
    }));
    setMedicineQuery(medicine.name);
    setSelectedMedicine(medicine);
    setError('');
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
    setSelectedMedicine(null);
  };

  if (isEdit && isLoading) return <div className="p-4"><ListSkeleton /></div>;

  const hasDraft = !isEdit && draftLoaded && !isListingDraftEmpty({ ...form, medicineQuery, updatedAt: '' });

  return (
    <div className="min-w-0 overflow-x-hidden">
      <TopBar title={isEdit ? 'Edit Listing' : 'Add Listing'} showBack />
      <form className="p-4 space-y-4 min-w-0" onSubmit={handleSubmit}>
        {!isEdit && hasDraft && (
          <div className="rounded-[var(--radius-md)] border border-primary/30 bg-primary-subtle/30 p-3 flex items-center justify-between gap-3">
            <p className="text-sm">{t('listing.draftRestored')}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => void clearDraft()}>
              {t('listing.clearDraft')}
            </Button>
          </div>
        )}

        {!isEdit ? (
          <MedicineNameAutocomplete
            label="Search Medicine"
            value={medicineQuery}
            placeholder="Type medicine name..."
            onValueChange={handleMedicineQueryChange}
            onMedicineSelect={handleMedicineSelect}
            inputTestId="medicine-search-input"
            resultsTestId="medicine-search-results"
          />
        ) : null}

        {selectedMedicine && <MedicineInfoPanel medicine={selectedMedicine} />}

        <MedicineImageUpload
          label="Listing image (optional)"
          value={form.imageUrl ?? ''}
          allowUpload={false}
          onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
          testId="listing-image-upload"
        />

        <div><Label htmlFor="listing-batch-number">Batch Number</Label><Input id="listing-batch-number" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} required /></div>
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
