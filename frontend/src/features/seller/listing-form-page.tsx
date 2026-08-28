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
import { MedicineFormFields } from '@/components/medicine/medicine-form-fields';
import { apiClient } from '@/lib/api';
import { getErrorMessage } from '@/lib/api-errors';
import { useInventoryStats } from '@/hooks/use-api';
import { useCreateSellerMedicine } from '@/hooks/use-seller-medicines';
import { useMedicineSuggestions } from '@/hooks/use-medicine-suggestions';
import {
  EMPTY_MEDICINE_FORM,
  hasMedicineFormErrors,
  validateMedicineForm,
  type MedicineFormErrors,
  type MedicineFormValues,
} from '@/lib/medicine-form';
import { applyMedicineAutofill } from '@/lib/medicine-autofill';
import {
  clearListingDraft,
  isListingDraftEmpty,
  loadListingDraft,
  saveListingDraft,
  type ListingDraft,
} from '@/lib/listing-draft';
import type { ItemDeliveryMode, Listing, Medicine } from '@/types';

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
  deliveryMode: 'SELLER_DELIVERS' as const,
  estimatedDeliveryDays: '',
};

type CatalogMode = 'search' | 'create';

export function ListingFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [medicineQuery, setMedicineQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('search');
  const [medicineForm, setMedicineForm] = useState<MedicineFormValues>(EMPTY_MEDICINE_FORM);
  const [medicineErrors, setMedicineErrors] = useState<MedicineFormErrors>({});
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
  const createMedicine = useCreateSellerMedicine();
  const { data: medicineSuggestions, isFetching: isSearchingMedicines } = useMedicineSuggestions(
    medicineQuery,
    !isEdit && catalogMode === 'search' && !selectedMedicine,
  );

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
        deliveryMode: existing.deliveryMode ?? 'SELLER_DELIVERS',
        estimatedDeliveryDays:
          existing.estimatedDeliveryDays != null ? String(existing.estimatedDeliveryDays) : '',
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
          deliveryMode: draft.deliveryMode ?? 'SELLER_DELIVERS',
          estimatedDeliveryDays: draft.estimatedDeliveryDays ?? '',
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

  const { data: inventoryStats } = useInventoryStats();
  const maxActiveListings = inventoryStats?.maxActiveListings ?? 50;
  const atActiveCap =
    !isEdit && (inventoryStats?.active ?? 0) >= maxActiveListings;

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
        deliveryMode: form.deliveryMode,
        ...(form.estimatedDeliveryDays
          ? { estimatedDeliveryDays: Number(form.estimatedDeliveryDays) }
          : {}),
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

  const selectMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setForm((f) => ({
      ...f,
      medicineId: medicine.id,
      medicineQuery: medicine.name,
      imageUrl: medicine.imageUrl ?? '',
    }));
    setMedicineQuery(medicine.name);
    setCatalogMode('search');
    setMedicineForm(EMPTY_MEDICINE_FORM);
    setMedicineErrors({});
    setError('');
  };

  const handleMedicineQueryChange = (value: string) => {
    setMedicineQuery(value);
    setForm((f) => ({ ...f, medicineId: '', medicineQuery: value }));
    setSelectedMedicine(null);
    setError('');
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    selectMedicine(medicine);
  };

  const openCreateMedicine = () => {
    setCatalogMode('create');
    setMedicineForm((current) => ({
      ...current,
      name: medicineQuery.trim() || current.name,
    }));
    setMedicineErrors({});
    setError('');
  };

  const cancelCreateMedicine = () => {
    setCatalogMode('search');
    setMedicineForm(EMPTY_MEDICINE_FORM);
    setMedicineErrors({});
  };

  const updateMedicineField = <K extends keyof MedicineFormValues>(key: K, value: MedicineFormValues[K]) => {
    setMedicineForm((current) => ({ ...current, [key]: value }));
    setMedicineErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setError('');
  };

  const saveNewMedicine = async () => {
    const validationErrors = validateMedicineForm(medicineForm, {
      required: t('admin.medicines.validation.required'),
      dosageForm: t('admin.medicines.validation.dosageForm'),
      imageUrl: t('admin.medicines.validation.imageUrl'),
    });
    if (hasMedicineFormErrors(validationErrors)) {
      setMedicineErrors(validationErrors);
      return;
    }

    try {
      const created = await createMedicine.mutateAsync(medicineForm);
      selectMedicine(created);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !form.medicineId) {
      if (catalogMode === 'create') {
        void saveNewMedicine();
        return;
      }
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
    setCatalogMode('search');
    setMedicineForm(EMPTY_MEDICINE_FORM);
  };

  if (isEdit && isLoading) return <div className="p-4"><ListSkeleton /></div>;

  const hasDraft = !isEdit && draftLoaded && !isListingDraftEmpty({ ...form, medicineQuery, updatedAt: '' });
  const searchHasQuery = medicineQuery.trim().length >= 2;
  const searchResults = medicineSuggestions?.data ?? [];
  const showCreateMedicinePrompt =
    !isEdit &&
    !selectedMedicine &&
    catalogMode === 'search' &&
    searchHasQuery &&
    !isSearchingMedicines &&
    searchResults.length === 0;

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

        {!isEdit && (
          <section className="space-y-3 rounded-[var(--radius-md)] border border-border-subtle p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">{t('listing.catalogSearchTitle')}</h2>
                <p className="text-xs text-text-secondary">{t('listing.catalogSearchDesc')}</p>
              </div>
              {selectedMedicine && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMedicine(null);
                    setForm((f) => ({ ...f, medicineId: '', medicineQuery: '' }));
                    setMedicineQuery('');
                    setCatalogMode('search');
                  }}
                  data-testid="listing-change-medicine"
                >
                  {t('listing.changeMedicine')}
                </Button>
              )}
            </div>

            {!selectedMedicine && catalogMode === 'search' && (
              <>
                <MedicineNameAutocomplete
                  label={t('listing.searchMedicine')}
                  value={medicineQuery}
                  placeholder={t('listing.searchMedicinePlaceholder')}
                  onValueChange={handleMedicineQueryChange}
                  onMedicineSelect={handleMedicineSelect}
                  inputTestId="medicine-search-input"
                  resultsTestId="medicine-search-results"
                />
                {showCreateMedicinePrompt && (
                  <p className="text-sm text-text-secondary" data-testid="listing-medicine-not-found">
                    {t('listing.medicineNotFound')}
                  </p>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={openCreateMedicine}
                  data-testid="listing-create-medicine-button"
                >
                  {t('listing.createNewMedicine')}
                </Button>
              </>
            )}

            {!selectedMedicine && catalogMode === 'create' && (
              <div className="space-y-4" data-testid="listing-create-medicine-form">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium">{t('listing.createNewMedicineTitle')}</h3>
                    <p className="text-xs text-text-secondary">{t('listing.createNewMedicineDesc')}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={cancelCreateMedicine}>
                    {t('listing.backToSearch')}
                  </Button>
                </div>
                <MedicineFormFields
                  mode="create"
                  form={medicineForm}
                  errors={medicineErrors}
                  onFieldChange={updateMedicineField}
                  onMedicineAutofill={(medicine) => {
                    setMedicineForm((current) => applyMedicineAutofill(current, medicine, new Set()));
                  }}
                  onExistingMedicineSelect={(medicine) => selectMedicine(medicine)}
                  nameInputTestId="seller-medicine-name"
                />
                <Button
                  type="button"
                  className="w-full"
                  loading={createMedicine.isPending}
                  onClick={() => void saveNewMedicine()}
                  data-testid="listing-save-medicine-button"
                >
                  {t('listing.saveMedicineAndContinue')}
                </Button>
              </div>
            )}

            {selectedMedicine && catalogMode === 'search' && <MedicineInfoPanel medicine={selectedMedicine} />}
          </section>
        )}

        {isEdit && selectedMedicine && <MedicineInfoPanel medicine={selectedMedicine} />}

        {selectedMedicine && (
          <section className="space-y-4" data-testid="listing-details-section">
            <div>
              <h2 className="text-sm font-medium">{t('listing.listingDetailsTitle')}</h2>
              <p className="text-xs text-text-secondary">{t('listing.listingDetailsDesc')}</p>
            </div>

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

            <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-border-subtle p-3">
              <legend className="px-1 text-sm font-medium">{t('listing.deliveryMode')}</legend>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMode"
                  className="mt-1"
                  checked={form.deliveryMode === 'SELLER_DELIVERS'}
                  onChange={() => setForm((f) => ({ ...f, deliveryMode: 'SELLER_DELIVERS' as ItemDeliveryMode }))}
                  data-testid="listing-delivery-mode-seller-delivers"
                />
                <span>{t('listing.deliveryModeSellerDelivers')}</span>
              </label>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMode"
                  className="mt-1"
                  checked={form.deliveryMode === 'BUYER_PICKUP'}
                  onChange={() => setForm((f) => ({ ...f, deliveryMode: 'BUYER_PICKUP' as ItemDeliveryMode }))}
                  data-testid="listing-delivery-mode-buyer-pickup"
                />
                <span>{t('listing.deliveryModeBuyerPickup')}</span>
              </label>
            </fieldset>

            <div>
              <Label htmlFor="listing-estimated-delivery-days">{t('listing.estimatedDeliveryDays')}</Label>
              <Input
                id="listing-estimated-delivery-days"
                type="number"
                min={1}
                value={form.estimatedDeliveryDays}
                onChange={(e) => setForm({ ...form, estimatedDeliveryDays: e.target.value })}
                placeholder={t('listing.estimatedDeliveryDaysHint')}
                data-testid="listing-estimated-delivery-days"
              />
            </div>
          </section>
        )}

        {atActiveCap && (
          <p className="text-sm text-warning" data-testid="listing-active-cap-warning">
            {t('listing.activeCapReached', { max: maxActiveListings })}
          </p>
        )}

        {error && <p className="text-sm text-danger" data-testid="listing-form-error">{error}</p>}
        <Button
          type="submit"
          className="w-full"
          loading={save.isPending || createMedicine.isPending}
          disabled={atActiveCap || (!isEdit && !selectedMedicine && catalogMode !== 'create')}
        >
          {isEdit ? 'Update Listing' : catalogMode === 'create' && !selectedMedicine ? t('listing.saveMedicineAndContinue') : 'Create Listing'}
        </Button>
      </form>
    </div>
  );
}
