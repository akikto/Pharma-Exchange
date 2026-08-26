import { describe, expect, it } from 'vitest';
import { validateImportFile, MEDICINE_IMPORT_MAX_BYTES } from '@/lib/medicine-import-types';

describe('validateImportFile', () => {
  it('rejects unsupported extensions', () => {
    const file = new File(['x'], 'notes.pdf', { type: 'application/pdf' });
    expect(validateImportFile(file)).toMatch(/Only/);
  });

  it('rejects empty files', () => {
    const file = new File([], 'empty.csv', { type: 'text/csv' });
    expect(validateImportFile(file)).toMatch(/empty/i);
  });

  it('rejects oversized files', () => {
    const big = new Uint8Array(MEDICINE_IMPORT_MAX_BYTES + 1);
    const file = new File([big], 'big.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    expect(validateImportFile(file)).toMatch(/too large/i);
  });

  it('accepts valid csv', () => {
    const file = new File(['name,company\n'], 'ok.csv', { type: 'text/csv' });
    expect(validateImportFile(file)).toBeNull();
  });
});
