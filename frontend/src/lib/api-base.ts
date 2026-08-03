const DEFAULT_API_BASE = '/api/v1';

/**
 * Resolves the client API base URL so auth and other requests always target
 * `/api/v1/*` (or legacy `/api/*`) even when env points at a bare server root.
 */
export function resolveApiBase(
  baseUrl?: string,
  legacyUrl?: string,
  fallback = DEFAULT_API_BASE,
): string {
  const raw = (baseUrl || legacyUrl || fallback).trim().replace(/\/+$/, '');
  if (!raw) return fallback;

  if (/\/api\/v\d+$/i.test(raw)) return raw;

  if (raw === '/api' || raw.endsWith('/api')) return `${raw}/v1`;

  if (/^https?:\/\//i.test(raw)) return `${raw}/api/v1`;

  return raw;
}

export function buildApiUrl(base: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
