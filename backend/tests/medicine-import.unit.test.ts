import { describe, expect, it } from 'vitest';
import { medicineIdentityKey, medicineImportService } from '../src/modules/medicine/medicine-import.service';
import { readMedicineImportTemplateBuffer } from '../src/modules/medicine/medicine-import-template';

describe('medicineIdentityKey', () => {
  it('normalizes case and whitespace for stable matching', () => {
    const a = medicineIdentityKey({
      name: ' Napa ',
      company: 'Beximco',
      dosageForm: 'tablet',
      strength: '500mg',
      packSize: '10 tablets',
    });
    const b = medicineIdentityKey({
      name: 'napa',
      company: 'beximco',
      dosageForm: 'TABLET',
      strength: '500mg',
      packSize: '10 tablets',
    });
    expect(a).toBe(b);
  });
});

describe('medicineImportService.buildTemplateWorkbook', () => {
  it('returns a non-empty xlsx buffer', () => {
    const buffer = medicineImportService.buildTemplateWorkbook();
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 2).toString('utf8')).toBe('PK');
  });

  it('matches the committed static template asset', () => {
    const fromService = medicineImportService.buildTemplateWorkbook();
    const fromAsset = readMedicineImportTemplateBuffer();
    expect(fromService.equals(fromAsset)).toBe(true);
  });
});
