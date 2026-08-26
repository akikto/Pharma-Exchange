import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { MedicineImportExportDialog } from '@/features/admin/components/medicine-import-export-dialog';

const previewMutate = vi.fn();
const importMutate = vi.fn();

vi.mock('@/hooks/use-medicine-import-export', () => ({
  useMedicineImportPreview: () => ({
    mutateAsync: previewMutate,
    isPending: false,
    reset: vi.fn(),
  }),
  useMedicineImportCommit: () => ({
    mutateAsync: importMutate,
    isPending: false,
    reset: vi.fn(),
  }),
  downloadMedicineTemplate: vi.fn(),
  exportMedicinesFile: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('MedicineImportExportDialog', () => {
  beforeEach(() => {
    void i18n.changeLanguage('en');
    previewMutate.mockReset();
    importMutate.mockReset();
  });

  it('shows preview summary after valid file selection', async () => {
    previewMutate.mockResolvedValue({
      totalRows: 2,
      validRows: 2,
      invalidRows: 0,
      newMedicines: 2,
      existingMedicines: 0,
      duplicateInFile: 0,
      errors: [],
      mode: 'upsert',
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MedicineImportExportDialog open searchQuery="" onOpenChange={() => {}} />
      </I18nextProvider>,
    );

    const file = new File(['x'], 'medicines.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const input = screen.getByTestId('medicine-import-file-input');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(previewMutate).toHaveBeenCalled();
      expect(screen.getByTestId('medicine-import-preview-summary')).toBeInTheDocument();
    });
  });

  it('runs import on confirm', async () => {
    previewMutate.mockResolvedValue({
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      newMedicines: 1,
      existingMedicines: 0,
      duplicateInFile: 0,
      errors: [],
      mode: 'upsert',
    });
    importMutate.mockResolvedValue({
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      newMedicines: 1,
      existingMedicines: 0,
      duplicateInFile: 0,
      errors: [],
      mode: 'upsert',
      created: 1,
      updated: 0,
      skipped: 0,
      failed: 0,
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MedicineImportExportDialog open searchQuery="" onOpenChange={() => {}} />
      </I18nextProvider>,
    );

    const file = new File(['x'], 'medicines.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    fireEvent.change(screen.getByTestId('medicine-import-file-input'), { target: { files: [file] } });

    await screen.findByTestId('medicine-import-confirm');
    fireEvent.click(screen.getByTestId('medicine-import-confirm'));

    await waitFor(() => {
      expect(importMutate).toHaveBeenCalled();
      expect(screen.getByTestId('medicine-import-result-summary')).toBeInTheDocument();
    });
  });
});
