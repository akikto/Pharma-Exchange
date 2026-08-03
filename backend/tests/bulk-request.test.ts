import { describe, it, expect } from 'vitest';
import { BulkExpiryPreset } from '@prisma/client';
import { resolveExpiryDate } from '../src/modules/bulk-request/bulkRequest.service';
import { AppError } from '../src/shared/errors/AppError';

describe('resolveExpiryDate', () => {
  it('adds months for preset values', () => {
    const now = Date.now();
    const three = resolveExpiryDate(BulkExpiryPreset.THREE_MONTHS);
    const diffDays = (three.getTime() - now) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(80);
    expect(diffDays).toBeLessThan(100);
  });

  it('requires customExpiryDays for CUSTOM preset', () => {
    expect(() => resolveExpiryDate(BulkExpiryPreset.CUSTOM)).toThrow(AppError);
    const custom = resolveExpiryDate(BulkExpiryPreset.CUSTOM, 45);
    expect(custom.getTime()).toBeGreaterThan(Date.now());
  });
});
