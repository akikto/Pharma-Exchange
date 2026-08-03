import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearStoredFcmToken,
  dismissPushPrompt,
  getOrCreateDeviceId,
  getStoredFcmToken,
  isPushPromptDismissed,
  setStoredFcmToken,
} from '@/lib/push-device';

describe('push-device', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates and reuses a device id', () => {
    const first = getOrCreateDeviceId();
    const second = getOrCreateDeviceId();
    expect(first).toBe(second);
    expect(first.length).toBeGreaterThan(10);
  });

  it('stores and clears fcm token', () => {
    setStoredFcmToken('token-abc');
    expect(getStoredFcmToken()).toBe('token-abc');
    clearStoredFcmToken();
    expect(getStoredFcmToken()).toBeNull();
  });

  it('tracks dismissed push prompt', () => {
    expect(isPushPromptDismissed()).toBe(false);
    dismissPushPrompt();
    expect(isPushPromptDismissed()).toBe(true);
  });
});
