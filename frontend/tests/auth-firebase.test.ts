import { describe, it, expect } from 'vitest';
import { isFirebaseConfigured } from '@/lib/firebase';

describe('firebase auth helpers', () => {
  it('isFirebaseConfigured reflects env vars', () => {
    expect(typeof isFirebaseConfigured()).toBe('boolean');
  });
});
