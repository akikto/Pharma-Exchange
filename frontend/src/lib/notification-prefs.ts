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
  prefs?: Partial<NotificationPrefs> | Record<string, boolean> | null,
): NotificationPrefs {
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(prefs ?? {}),
  };
}
