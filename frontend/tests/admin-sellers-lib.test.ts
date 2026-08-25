import { describe, expect, it } from 'vitest';
import { verificationStatusVariant } from '@/lib/admin-sellers';

describe('admin-sellers helpers', () => {
  it('maps verification statuses to chip variants', () => {
    expect(verificationStatusVariant('APPROVED')).toBe('success');
    expect(verificationStatusVariant('REJECTED')).toBe('danger');
    expect(verificationStatusVariant('UNDER_REVIEW')).toBe('info');
    expect(verificationStatusVariant('PENDING')).toBe('warning');
  });
});
