import { apiClient } from '@/lib/api';
import { getFirebaseMessaging, isPushConfigured } from '@/lib/firebase';
import {
  clearStoredFcmToken,
  getOrCreateDeviceId,
  getStoredFcmToken,
  setStoredFcmToken,
} from '@/lib/push-device';

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  return Notification.requestPermission();
}

async function getMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  return registration;
}

export async function registerFcmTokenWithBackend(): Promise<string | null> {
  if (!isPushConfigured() || !isPushSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const { getToken } = await import('firebase/messaging');
  const registration = await getMessagingServiceWorker();
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) return null;

  const stored = getStoredFcmToken();
  if (stored === token) return token;

  await apiClient.post('/auth/fcm-token', {
    token,
    deviceId: getOrCreateDeviceId(),
    platform: 'web',
  });
  setStoredFcmToken(token);
  return token;
}

export async function unregisterFcmTokenFromBackend(): Promise<void> {
  const token = getStoredFcmToken();
  if (!token) return;

  try {
    await apiClient.delete('/auth/fcm-token', { token });
  } catch {
    // ignore network errors during logout
  } finally {
    clearStoredFcmToken();
  }
}

export type ForegroundPushPayload = {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
};

export async function subscribeToForegroundPush(
  onMessage: (payload: ForegroundPushPayload) => void,
): Promise<(() => void) | undefined> {
  if (!isPushConfigured() || !isPushSupported()) return undefined;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return undefined;

  const { onMessage: onFirebaseMessage } = await import('firebase/messaging');
  return onFirebaseMessage(messaging, onMessage);
}
