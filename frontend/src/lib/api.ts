const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('pharmex_refresh', refresh);
}

export function getAccessToken() { return accessToken; }

export function loadRefreshToken() {
  refreshToken = localStorage.getItem('pharmex_refresh');
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('pharmex_refresh');
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function refreshAccessToken(): Promise<boolean> {
  const token = refreshToken || localStorage.getItem('pharmex_refresh');
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      0,
      'সার্ভারে সংযোগ করা যায়নি। ইন্টারনেট চেক করুন অথবা পেজ রিফ্রেশ করুন।',
      'NETWORK_ERROR',
    );
  }

  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.Authorization = `Bearer ${accessToken}`;
      try {
        res = await fetch(`${API_BASE}${path}`, { ...options, headers });
      } catch {
        throw new ApiError(
          0,
          'সার্ভারে সংযোগ করা যায়নি। ইন্টারনেট চেক করুন অথবা পেজ রিফ্রেশ করুন।',
          'NETWORK_ERROR',
        );
      }
    }
  }

  if (res.status === 401) {
    clearTokens();
    onUnauthorized?.();
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    const message = err.code === 'RATE_LIMIT_EXCEEDED' && err.error
      ? err.error
      : err.error || 'Request failed';
    throw new ApiError(res.status, message, err.code);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const apiClient = {
  get: <T>(path: string) => api<T>(path),
  post: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api<T>(path, { method: 'POST', body: form });
  },
};
