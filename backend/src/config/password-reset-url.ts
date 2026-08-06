import { PHARMEX_FRONTEND_ORIGIN_PATTERN, PHARMEX_FRONTEND_ORIGINS } from './cors-origins';

/** Vercel backend deployments — reset links must never point here. */
const BACKEND_ORIGIN_PATTERNS = [
  /^https?:\/\/pharma-exchange-backend(?:-[a-z0-9-]+)?\.vercel\.app\/?$/i,
  /^https?:\/\/[^/]*-backend\.vercel\.app\/?$/i,
];

export function isBackendLikeOrigin(origin: string): boolean {
  const normalized = origin.trim().replace(/\/$/, '');
  return BACKEND_ORIGIN_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isKnownFrontendOrigin(origin: string): boolean {
  const normalized = origin.trim().replace(/\/$/, '');
  if (PHARMEX_FRONTEND_ORIGINS.includes(normalized)) return true;
  return PHARMEX_FRONTEND_ORIGIN_PATTERN.test(normalized);
}

function parseCorsOrigins(corsOrigin: string): string[] {
  if (corsOrigin === '*') return [];
  return corsOrigin
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function pickFrontendOriginFromCors(corsOrigin: string): string | undefined {
  for (const origin of parseCorsOrigins(corsOrigin)) {
    if (!isBackendLikeOrigin(origin)) return origin;
  }
  return undefined;
}

export function assertProductionPasswordResetConfig(
  nodeEnv: string,
  passwordResetUrlBase: string | undefined,
  corsOrigin: string,
): void {
  if (nodeEnv !== 'production') return;

  const configured = passwordResetUrlBase?.trim();
  if (!configured) {
    throw new Error(
      'PASSWORD_RESET_URL_BASE is required in production and must be the frontend app URL (e.g. https://pharma-exchange-frontend.vercel.app).',
    );
  }

  const base = configured.replace(/\/$/, '');
  if (isBackendLikeOrigin(base)) {
    throw new Error(
      'PASSWORD_RESET_URL_BASE must point to the frontend app, not the API backend.',
    );
  }
}

export function resolvePasswordResetBaseUrl(options: {
  passwordResetUrlBase?: string;
  corsOrigin: string;
  nodeEnv: string;
}): string {
  const configured = options.passwordResetUrlBase?.trim();
  if (configured) {
    const base = configured.replace(/\/$/, '');
    if (isBackendLikeOrigin(base)) {
      throw new Error(
        'PASSWORD_RESET_URL_BASE must point to the frontend app, not the API backend.',
      );
    }
    return base;
  }

  if (options.nodeEnv === 'production') {
    throw new Error(
      'PASSWORD_RESET_URL_BASE is required in production and must be the frontend app URL.',
    );
  }

  const fromCors = pickFrontendOriginFromCors(options.corsOrigin);
  if (fromCors) return fromCors;

  return 'http://localhost:5173';
}
