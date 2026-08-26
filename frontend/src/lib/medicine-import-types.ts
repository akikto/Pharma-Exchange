export type MedicineImportMode = 'upsert' | 'createOnly' | 'updateOnly';

export interface MedicineImportRowError {
  row: number;
  name?: string;
  message: string;
}

export interface MedicineImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newMedicines: number;
  existingMedicines: number;
  duplicateInFile: number;
  errors: MedicineImportRowError[];
  mode: MedicineImportMode;
}

export interface MedicineImportResult extends MedicineImportPreviewResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

export const MEDICINE_IMPORT_MAX_BYTES = 5 * 1024 * 1024;

export const MEDICINE_IMPORT_ACCEPT = '.csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImportFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith('.csv') && !name.endsWith('.xlsx')) {
    return 'Only .csv and .xlsx files are supported';
  }
  if (file.size === 0) {
    return 'The selected file is empty';
  }
  if (file.size > MEDICINE_IMPORT_MAX_BYTES) {
    return 'File is too large. Maximum size is 5 MB.';
  }
  return null;
}
