import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NOTIFICATION_PREFS,
  normalizeNotificationPrefs,
} from '@/lib/notification-prefs';

describe('notification-prefs', () => {
  it('returns defaults when prefs are missing', () => {
    expect(normalizeNotificationPrefs(null)).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(normalizeNotificationPrefs(undefined)).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it('merges user overrides', () => {
    expect(normalizeNotificationPrefs({ orders: false, promotions: true })).toEqual({
      buyRequests: true,
      orders: false,
      chat: true,
      promotions: true,
    });
  });
});
