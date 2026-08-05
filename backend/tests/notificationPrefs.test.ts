import { describe, expect, it } from 'vitest';
import { NotificationType } from '@prisma/client';
import {
  DEFAULT_NOTIFICATION_PREFS,
  normalizeNotificationPrefs,
  prefKeyForType,
  shouldDeliverPush,
} from '../src/modules/notification/notificationPrefs';

describe('notificationPrefs', () => {
  it('returns defaults for missing or invalid prefs', () => {
    expect(normalizeNotificationPrefs(null)).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(normalizeNotificationPrefs(undefined)).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(normalizeNotificationPrefs('bad')).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it('merges partial prefs', () => {
    expect(normalizeNotificationPrefs({ chat: false, promotions: true })).toEqual({
      buyRequests: true,
      orders: true,
      chat: false,
      promotions: true,
    });
  });

  it('maps notification types to preference keys', () => {
    expect(prefKeyForType(NotificationType.BUY_REQUEST)).toBe('buyRequests');
    expect(prefKeyForType(NotificationType.ORDER_UPDATE)).toBe('orders');
    expect(prefKeyForType(NotificationType.CHAT_MESSAGE)).toBe('chat');
    expect(prefKeyForType(NotificationType.SYSTEM)).toBe('promotions');
    expect(prefKeyForType(NotificationType.VERIFICATION)).toBeNull();
  });

  it('respects user preferences', () => {
    const prefs = { ...DEFAULT_NOTIFICATION_PREFS, orders: false, promotions: true };
    expect(shouldDeliverPush(NotificationType.ORDER_UPDATE, prefs)).toBe(false);
    expect(shouldDeliverPush(NotificationType.SYSTEM, prefs)).toBe(true);
    expect(shouldDeliverPush(NotificationType.VERIFICATION, prefs)).toBe(true);
    expect(shouldDeliverPush(NotificationType.ORDER_UPDATE, prefs, { force: true })).toBe(true);
  });
});
