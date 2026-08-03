import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getIsOnline } from '@/lib/online-utils';

describe('online-utils', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { ...originalNavigator, onLine: true },
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  });

  it('returns navigator.onLine when available', () => {
    Object.defineProperty(global.navigator, 'onLine', { configurable: true, value: false });
    expect(getIsOnline()).toBe(false);
  });
});
