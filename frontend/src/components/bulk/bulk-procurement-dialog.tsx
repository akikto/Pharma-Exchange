import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Snowflake, FileCheck, PackageCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateBulkRequest } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
  type BulkRequestForm,
  EXPIRY_PRESETS,
  URGENCY_OPTIONS,
  validateBulkForm,
  buildBulkPayload,
} from '@/lib/bulk-utils';
import type { Medicine } from '@/types';

const EMPTY_FORM: BulkRequestForm = {
  medicineId: '',
  medicineName: '',
  quantity: '',
  targetPrice: '',
  urgency: 'NORMAL',
  deliveryAddress: '',
  phone: '',
  requiresColdChain: false,
  requiresVatInvoice: false,
  requiresFactorySealed: false,
  expiryPreset: 'SIX_MONTHS',
  customExpiryDays: '',
  note: '',
};

interface BulkProcurementDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
  defaultAddress?: string;
  defaultPhone?: string;
}

export function BulkProcurementDialog({
  open,
  onClose,
  onSuccess,
  defaultAddress = '',
  defaultPhone = '',
}: BulkProcurementDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const createBulk = useCreateBulkRequest();
  const [form, setForm] = useState<BulkRequestForm>({ ...EMPTY_FORM, deliveryAddress: defaultAddress, phone: defaultPhone });
  const [medicineQuery, setMedicineQuery] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: medicines } = useQuery({
    queryKey: ['medicines', medicineQuery],
    queryFn: () => apiClient.get<{ data: Medicine[] }>(`/medicines?q=${encodeURIComponent(medicineQuery)}&limit=8`),
    enabled: medicineQuery.length >= 2,
  });

  const resetAndClose = () => {
    setForm({ ...EMPTY_FORM, deliveryAddress: defaultAddress, phone: defaultPhone });
    setMedicineQuery('');
    setErrors({});
    onClose();
  };

  const handleSubmit = async () => {
    const nextErrors = validateBulkForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const result = await createBulk.mutateAsync(buildBulkPayload(form));
      toast({ title: t('toast.success'), description: t('bulk.postSuccess') });
      resetAndClose();
      onSuccess?.(result.id);
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  const totalEstimate = Number(form.quantity) * Number(form.targetPrice);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('bulk.title')}</DialogTitle>
          <DialogDescription>{t('bulk.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t('bulk.medicine')}</Label>
            <Input
              value={medicineQuery || form.medicineName}
              onChange={(e) => {
                setMedicineQuery(e.target.value);
                if (!e.target.value) setForm((f) => ({ ...f, medicineId: '', medicineName: '' }));
              }}
              placeholder={t('bulk.medicinePlaceholder')}
              data-testid="bulk-medicine-search"
            />
            {errors.medicineId && <p className="text-xs text-danger mt-1">{t('validation.required')}</p>}
            {medicines?.data && medicineQuery.length >= 2 && (
              <div className="mt-2 border border-border-subtle rounded-[var(--radius-md)] max-h-36 overflow-y-auto">
                {medicines.data.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="w-full text-left p-2 text-sm hover:bg-surface-raised"
                    onClick={() => {
                      setForm((f) => ({ ...f, medicineId: m.id, medicineName: m.name }));
                      setMedicineQuery(m.name);
                    }}
                  >
                    {m.name} — {m.company}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('bulk.quantity')}</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                data-testid="bulk-quantity"
              />
              {errors.quantity && <p className="text-xs text-danger mt-1">{t('validation.quantityMin', { min: 1 })}</p>}
            </div>
            <div>
              <Label>{t('bulk.targetPrice')}</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.targetPrice}
                onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
              />
              {errors.targetPrice && <p className="text-xs text-danger mt-1">{t('validation.required')}</p>}
            </div>
          </div>

          {totalEstimate > 0 && (
            <p className="text-sm text-text-secondary">
              {t('bulk.estimatedTotal')}: <span className="font-semibold text-foreground">{formatPrice(totalEstimate)}</span>
            </p>
          )}

          <div>
            <Label>{t('bulk.urgency')}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {URGENCY_OPTIONS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm({ ...form, urgency: u })}
                  className={`rounded-full px-3 py-1 text-xs border ${
                    form.urgency === u ? 'bg-primary text-on-primary border-primary' : 'border-border-subtle'
                  }`}
                >
                  {t(`bulk.urgency.${u}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{t('bulk.expiry')}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {EXPIRY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setForm({ ...form, expiryPreset: preset })}
                  className={`rounded-full px-3 py-1 text-xs border ${
                    form.expiryPreset === preset ? 'bg-primary text-on-primary border-primary' : 'border-border-subtle'
                  }`}
                >
                  {t(`bulk.expiry.${preset}`)}
                </button>
              ))}
            </div>
            {form.expiryPreset === 'CUSTOM' && (
              <Input
                className="mt-2"
                type="number"
                min={1}
                placeholder={t('bulk.customDaysPlaceholder')}
                value={form.customExpiryDays}
                onChange={(e) => setForm({ ...form, customExpiryDays: e.target.value })}
              />
            )}
            {errors.customExpiryDays && <p className="text-xs text-danger mt-1">{t('validation.required')}</p>}
          </div>

          <div>
            <Label>{t('bulk.deliveryAddress')}</Label>
            <Input
              value={form.deliveryAddress}
              onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
            />
            {errors.deliveryAddress && <p className="text-xs text-danger mt-1">{t('validation.required')}</p>}
          </div>

          <div>
            <Label>{t('bulk.phone')}</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            {errors.phone && <p className="text-xs text-danger mt-1">{t('validation.emailOrPhone')}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t('bulk.compliance')}</Label>
            <ComplianceToggle
              icon={Snowflake}
              label={t('bulk.coldChain')}
              checked={form.requiresColdChain}
              onChange={(v) => setForm({ ...form, requiresColdChain: v })}
            />
            <ComplianceToggle
              icon={FileCheck}
              label={t('bulk.vatInvoice')}
              checked={form.requiresVatInvoice}
              onChange={(v) => setForm({ ...form, requiresVatInvoice: v })}
            />
            <ComplianceToggle
              icon={PackageCheck}
              label={t('bulk.factorySealed')}
              checked={form.requiresFactorySealed}
              onChange={(v) => setForm({ ...form, requiresFactorySealed: v })}
            />
          </div>

          <div>
            <Label>{t('bulk.note')}</Label>
            <Input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder={t('bulk.notePlaceholder')}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={resetAndClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} loading={createBulk.isPending} data-testid="bulk-submit">
            {t('bulk.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComplianceToggle({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: typeof Snowflake;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left ${
        checked ? 'border-primary bg-primary-subtle' : 'border-border-subtle'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-sm flex-1">{label}</span>
      <span className={`h-5 w-9 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-border-subtle'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}
