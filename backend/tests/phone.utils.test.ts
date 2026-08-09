import { describe, expect, it } from 'vitest';
import { isValidProfilePhone, normalizePhoneToE164 } from '../src/shared/utils/phone';

describe('phone utils', () => {
  it('normalizes Indian local numbers to +91 E.164', () => {
    expect(normalizePhoneToE164('9876543210')).toBe('+919876543210');
    expect(normalizePhoneToE164('09876543210')).toBe('+919876543210');
    expect(normalizePhoneToE164('919876543210')).toBe('+919876543210');
    expect(normalizePhoneToE164('+919876543210')).toBe('+919876543210');
    expect(normalizePhoneToE164('9153014194')).toBe('+919153014194');
  });

  it('preserves explicit international numbers', () => {
    expect(normalizePhoneToE164('+8801700000001')).toBe('+8801700000001');
    expect(normalizePhoneToE164('+14155552671')).toBe('+14155552671');
  });

  it('validates profile phone input', () => {
    expect(isValidProfilePhone('9876543210')).toBe(true);
    expect(isValidProfilePhone('+14155552671')).toBe(true);
    expect(isValidProfilePhone('123')).toBe(false);
    expect(isValidProfilePhone('')).toBe(false);
  });
});
