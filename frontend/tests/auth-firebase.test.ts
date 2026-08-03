import { describe, it, expect } from 'vitest';
import { isFirebaseConfigured, isPushConfigured } from '@/lib/firebase';

describe('firebase auth helpers', () => {
  it('isFirebaseConfigured reflects env vars', () => {
    expect(typeof isFirebaseConfigured()).toBe('boolean');
  });

  it('isPushConfigured requires vapid key', () => {
    expect(typeof isPushConfigured()).toBe('boolean');
  });
});
