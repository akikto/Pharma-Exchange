import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';
import {
  formatFileSize,
  validateImportFile,
  type MedicineImportMode,
  type MedicineImportPreviewResult,
  type MedicineImportResult,
} from '@/lib/medicine-import-types';
import {
  downloadMedicineTemplate,
  exportMedicinesFile,
  useMedicineImportCommit,
  useMedicineImportPreview,
} from '@/hooks/use-medicine-import-export';

type Step = 'menu' | 'import-select' | 'preview' | 'importing' | 'result';

type MedicineImportExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onImportSuccess?: () => void;
};

export function MedicineImportExportDialog({
  open,
  onOpenChange,
  searchQuery,
  onImportSuccess,
}: MedicineImportExportDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('menu');
  const [importFormat, setImportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mode, setMode] = useState<MedicineImportMode>('upsert');
  const [preview, setPreview] = useState<MedicineImportPreviewResult | null>(null);
  const [result, setResult] = useState<MedicineImportResult | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const previewMutation = useMedicineImportPreview();
  const importMutation = useMedicineImportCommit();

  const resetState = () => {
    setStep('menu');
    setSelectedFile(null);
    setFileError(null);
    setPreview(null);
    setResult(null);
    setBusyAction(null);
    previewMutation.reset();
    importMutation.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetState();
    onOpenChange(next);
  };

  const runExport = async (format: 'xlsx' | 'csv') => {
    setBusyAction(`export-${format}`);
    try {
      await exportMedicinesFile(format, searchQuery);
      toast({ title: t('admin.medicines.importExport.exportSuccess') });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('admin.medicines.importExport.exportError');
      toast({ title: message, variant: 'destructive' });
    } finally {
      setBusyAction(null);
    }
  };

  const runTemplateDownload = async () => {
    setBusyAction('template');
    try {
      await downloadMedicineTemplate();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('admin.medicines.importExport.templateError');
      toast({ title: message, variant: 'destructive' });
    } finally {
      setBusyAction(null);
    }
  };

  const openFilePicker = (format: 'xlsx' | 'csv') => {
    setImportFormat(format);
    setStep('import-select');
    setSelectedFile(null);
    setFileError(null);
    setPreview(null);
    setResult(null);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const onFileChosen = async (file: File | null) => {
    if (!file) return;
    const validationError = validateImportFile(file);
    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
    try {
      const data = await previewMutation.mutateAsync({ file, mode });
      setPreview(data);
      setStep('preview');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('admin.medicines.importExport.previewError');
      setFileError(message);
      setSelectedFile(null);
    }
  };

  const confirmImport = async () => {
    if (!selectedFile) return;
    setStep('importing');
    try {
      const data = await importMutation.mutateAsync({ file: selectedFile, mode });
      setResult(data);
      setStep('result');
      onImportSuccess?.();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('admin.medicines.importExport.importError');
      setFileError(message);
      setStep('preview');
    }
  };

  const isBusy = Boolean(busyAction) || previewMutation.isPending || importMutation.isPending || step === 'importing';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        data-testid="medicine-import-export-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.medicines.importExport.title')}</DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept={importFormat === 'csv' ? '.csv' : '.xlsx'}
          className="hidden"
          data-testid="medicine-import-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = '';
            void onFileChosen(file);
          }}
        />

        {step === 'menu' && (
          <div className="space-y-6">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {t('admin.medicines.importExport.importSection')}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  className="justify-start"
                  disabled={isBusy}
                  data-testid="medicine-import-xlsx"
                  onClick={() => openFilePicker('xlsx')}
                >
                  {t('admin.medicines.importExport.importExcel')}
                </Button>
                <Button
                  variant="secondary"
                  className="justify-start"
                  disabled={isBusy}
                  data-testid="medicine-import-csv"
                  onClick={() => openFilePicker('csv')}
                >
                  {t('admin.medicines.importExport.importCsv')}
                </Button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {t('admin.medicines.importExport.exportSection')}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  className="justify-start"
                  disabled={isBusy}
                  data-testid="medicine-export-xlsx"
                  onClick={() => void runExport('xlsx')}
                >
                  {busyAction === 'export-xlsx'
                    ? t('admin.medicines.importExport.exporting')
                    : t('admin.medicines.importExport.exportExcel')}
                </Button>
                <Button
                  variant="secondary"
                  className="justify-start"
                  disabled={isBusy}
                  data-testid="medicine-export-csv"
                  onClick={() => void runExport('csv')}
                >
                  {busyAction === 'export-csv'
                    ? t('admin.medicines.importExport.exporting')
                    : t('admin.medicines.importExport.exportCsv')}
                </Button>
              </div>
              {searchQuery.trim() ? (
                <p className="text-xs text-text-secondary">
                  {t('admin.medicines.importExport.exportFilteredHint')}
                </p>
              ) : null}
            </section>

            <Button
              variant="secondary"
              className="w-full"
              disabled={isBusy}
              data-testid="medicine-download-template"
              onClick={() => void runTemplateDownload()}
            >
              {busyAction === 'template'
                ? t('admin.medicines.importExport.downloadingTemplate')
                : t('admin.medicines.importExport.downloadTemplate')}
            </Button>
          </div>
        )}

        {step === 'import-select' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {t('admin.medicines.importExport.selectFileHint', { format: importFormat.toUpperCase() })}
            </p>
            {previewMutation.isPending ? (
              <p className="text-sm" data-testid="medicine-import-parsing">
                {t('admin.medicines.importExport.parsing')}
              </p>
            ) : null}
            {fileError ? (
              <p className="text-sm text-danger" data-testid="medicine-import-file-error">
                {fileError}
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="secondary" onClick={() => setStep('menu')} disabled={previewMutation.isPending}>
                {t('admin.medicines.importExport.cancel')}
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={previewMutation.isPending}
              >
                {t('admin.medicines.importExport.chooseFile')}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'preview' && preview && selectedFile && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-3 text-sm">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-text-secondary">{formatFileSize(selectedFile.size)}</p>
            </div>

            <label className="block text-sm">
              <span className="text-text-secondary">{t('admin.medicines.importExport.importMode')}</span>
              <select
                className="mt-1 w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-base px-3 py-2 text-sm"
                value={mode}
                disabled={isBusy}
                data-testid="medicine-import-mode"
                onChange={(e) => {
                  const nextMode = e.target.value as MedicineImportMode;
                  setMode(nextMode);
                  void (async () => {
                    try {
                      const data = await previewMutation.mutateAsync({ file: selectedFile, mode: nextMode });
                      setPreview(data);
                    } catch {
                      /* keep previous preview */
                    }
                  })();
                }}
              >
                <option value="upsert">{t('admin.medicines.importExport.modeUpsert')}</option>
                <option value="createOnly">{t('admin.medicines.importExport.modeCreateOnly')}</option>
                <option value="updateOnly">{t('admin.medicines.importExport.modeUpdateOnly')}</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2 text-sm" data-testid="medicine-import-preview-summary">
              <div>{t('admin.medicines.importExport.totalRows')}: <strong>{preview.totalRows}</strong></div>
              <div>{t('admin.medicines.importExport.validRows')}: <strong>{preview.validRows}</strong></div>
              <div>{t('admin.medicines.importExport.invalidRows')}: <strong>{preview.invalidRows}</strong></div>
              <div>{t('admin.medicines.importExport.newMedicines')}: <strong>{preview.newMedicines}</strong></div>
              <div>{t('admin.medicines.importExport.existingMedicines')}: <strong>{preview.existingMedicines}</strong></div>
              <div>{t('admin.medicines.importExport.duplicateInFile')}: <strong>{preview.duplicateInFile}</strong></div>
            </div>

            {preview.errors.length > 0 ? (
              <div className="max-h-40 overflow-y-auto rounded-[var(--radius-md)] border border-border-subtle p-2 text-sm space-y-2">
                {preview.errors.map((err) => (
                  <div key={`${err.row}-${err.message}`} data-testid="medicine-import-preview-error">
                    <p className="font-medium">
                      {t('admin.medicines.importExport.rowLabel', { row: err.row })}
                      {err.name ? ` — ${err.name}` : ''}
                    </p>
                    <p className="text-danger">{err.message}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {fileError ? (
              <p className="text-sm text-danger" data-testid="medicine-import-file-error">
                {fileError}
              </p>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="secondary" onClick={() => { setStep('menu'); setSelectedFile(null); }} disabled={isBusy}>
                {t('admin.medicines.importExport.cancel')}
              </Button>
              <Button
                onClick={() => void confirmImport()}
                disabled={isBusy || preview.validRows === 0}
                data-testid="medicine-import-confirm"
              >
                {t('admin.medicines.importExport.confirmImport')}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'importing' && (
          <p className="text-sm py-6 text-center" data-testid="medicine-import-progress">
            {t('admin.medicines.importExport.importing')}
          </p>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <p className="font-medium">{t('admin.medicines.importExport.importComplete')}</p>
            <div className="grid grid-cols-2 gap-2 text-sm" data-testid="medicine-import-result-summary">
              <div>{t('admin.medicines.importExport.totalRows')}: <strong>{result.totalRows}</strong></div>
              <div>{t('admin.medicines.importExport.created')}: <strong>{result.created}</strong></div>
              <div>{t('admin.medicines.importExport.updated')}: <strong>{result.updated}</strong></div>
              <div>{t('admin.medicines.importExport.skipped')}: <strong>{result.skipped}</strong></div>
              <div>{t('admin.medicines.importExport.failed')}: <strong>{result.failed}</strong></div>
            </div>
            {result.errors.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-[var(--radius-md)] border border-border-subtle p-2 text-sm space-y-2">
                {result.errors.map((err) => (
                  <div key={`result-${err.row}-${err.message}`}>
                    <p className="font-medium">
                      {t('admin.medicines.importExport.rowLabel', { row: err.row })}
                      {err.name ? ` — ${err.name}` : ''}
                    </p>
                    <p className="text-danger">{err.message}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)} data-testid="medicine-import-done">
                {t('admin.medicines.importExport.done')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
