import { NotificationType } from '@prisma/client';

export interface NotificationPrefs {
  buyRequests: boolean;
  orders: boolean;
  chat: boolean;
  promotions: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  buyRequests: true,
  orders: true,
  chat: true,
  promotions: false,
};

export function normalizeNotificationPrefs(
  prefs?: unknown,
): NotificationPrefs {
  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
  const raw = prefs as Record<string, unknown>;
  return {
    buyRequests: raw.buyRequests !== false,
    orders: raw.orders !== false,
    chat: raw.chat !== false,
    promotions: raw.promotions === true,
  };
}

/** Maps notification types to user preference keys. VERIFICATION is always delivered. */
export function prefKeyForType(type: NotificationType): keyof NotificationPrefs | null {
  switch (type) {
    case NotificationType.BUY_REQUEST:
      return 'buyRequests';
    case NotificationType.ORDER_UPDATE:
      return 'orders';
    case NotificationType.CHAT_MESSAGE:
      return 'chat';
    case NotificationType.SYSTEM:
      return 'promotions';
    case NotificationType.VERIFICATION:
      return null;
    default:
      return null;
  }
}

export function shouldDeliverPush(
  type: NotificationType,
  prefs: NotificationPrefs,
  options?: { force?: boolean },
): boolean {
  if (options?.force) return true;
  const key = prefKeyForType(type);
  if (key === null) return true;
  return prefs[key];
}
