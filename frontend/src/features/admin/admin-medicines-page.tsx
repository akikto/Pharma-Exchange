import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListSkeleton } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/ui/status-chip';
import { useToast } from '@/hooks/use-toast';
import { useAdminMedicines, useCreateMedicine, useUpdateMedicine } from '@/hooks/use-admin-medicines';
import { MedicineFormDialog } from '@/features/admin/components/medicine-form-dialog';
import type { MedicineFormValues, MedicineRecord } from '@/lib/medicine-form';

export function AdminMedicinesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineRecord | null>(null);

  const { data, isLoading, isError } = useAdminMedicines(search);
  const createMedicine = useCreateMedicine();
  const updateMedicine = useUpdateMedicine();

  const medicines = useMemo(() => data?.data ?? [], [data?.data]);

  const openCreateDialog = () => {
    setDialogMode('create');
    setSelectedMedicine(null);
    setDialogOpen(true);
  };

  const openEditDialog = (medicine: MedicineRecord) => {
    setDialogMode('edit');
    setSelectedMedicine(medicine);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: MedicineFormValues) => {
    if (dialogMode === 'create') {
      await createMedicine.mutateAsync(values);
      toast({ title: t('admin.medicines.createSuccess') });
      return;
    }
    if (!selectedMedicine) return;
    await updateMedicine.mutateAsync({ id: selectedMedicine.id, values });
    toast({ title: t('admin.medicines.updateSuccess') });
  };

  return (
    <div className="min-h-screen bg-surface-raised" data-testid="admin-medicines-page">
      <TopBar title={t('admin.medicines.title')} showBack />
      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">{t('admin.medicines.description')}</p>
          <Button onClick={openCreateDialog} data-testid="admin-medicines-add-button">
            {t('admin.medicines.addButton')}
          </Button>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('admin.medicines.searchPlaceholder')}
          data-testid="admin-medicines-search"
        />

        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <p className="text-center text-danger py-12">{t('admin.medicines.loadError')}</p>
        ) : medicines.length === 0 ? (
          <p className="text-center text-text-secondary py-12" data-testid="admin-medicines-empty">
            {t('admin.medicines.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle bg-surface-base">
            <table className="min-w-full text-sm" data-testid="admin-medicines-table">
              <thead className="bg-surface-raised text-left text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('admin.medicines.fields.name')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.medicines.fields.company')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.medicines.fields.dosageForm')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.medicines.fields.strength')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.medicines.fields.packSize')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.medicines.fields.category')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.medicines.fields.status')}</th>
                  <th className="px-3 py-2 font-medium">{t('admin.medicines.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((medicine) => (
                  <tr key={medicine.id} className="border-t border-border-subtle" data-testid={`medicine-row-${medicine.id}`}>
                    <td className="px-3 py-3 font-medium">{medicine.name}</td>
                    <td className="px-3 py-3">{medicine.company}</td>
                    <td className="px-3 py-3">{medicine.dosageForm}</td>
                    <td className="px-3 py-3">{medicine.strength || '—'}</td>
                    <td className="px-3 py-3">{medicine.packSize}</td>
                    <td className="px-3 py-3">{medicine.category}</td>
                    <td className="px-3 py-3">
                      <StatusChip
                        label={medicine.isActive === false
                          ? t('admin.medicines.statusInactive')
                          : t('admin.medicines.statusActive')}
                        variant={medicine.isActive === false ? 'warning' : 'success'}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditDialog(medicine)}
                        data-testid={`medicine-edit-${medicine.id}`}
                      >
                        {t('admin.medicines.editAction')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MedicineFormDialog
        open={dialogOpen}
        mode={dialogMode}
        medicine={selectedMedicine}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={createMedicine.isPending || updateMedicine.isPending}
      />
    </div>
  );
}
