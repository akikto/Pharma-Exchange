const DEVICE_ID_KEY = 'pharmex_device_id';
const FCM_TOKEN_KEY = 'pharmex_fcm_token';
const PUSH_PROMPT_DISMISSED_KEY = 'pharmex_push_prompt_dismissed';

export function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export function getStoredFcmToken(): string | null {
  return localStorage.getItem(FCM_TOKEN_KEY);
}

export function setStoredFcmToken(token: string): void {
  localStorage.setItem(FCM_TOKEN_KEY, token);
}

export function clearStoredFcmToken(): void {
  localStorage.removeItem(FCM_TOKEN_KEY);
}

export function isPushPromptDismissed(): boolean {
  return localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY) === '1';
}

export function dismissPushPrompt(): void {
  localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, '1');
}
