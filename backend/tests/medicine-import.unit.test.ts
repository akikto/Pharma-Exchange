import { describe, expect, it } from 'vitest';
import { medicineIdentityKey } from '../src/modules/medicine/medicine-import.service';

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
