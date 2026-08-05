import { env } from './env';

/** Canonical PharmEx frontend URLs (Vercel production + common misconfiguration). */
const PHARMEX_FRONTEND_ORIGINS = [
  'https://pharma-exchange-frontend.vercel.app',
  'https://pharma-exchange.vercel.app',
];

/** Vercel preview deployments for the PharmEx frontend project. */
const PHARMEX_FRONTEND_ORIGIN_PATTERN =
  /^https:\/\/pharma-exchange-frontend(?:-[a-z0-9-]+)?\.vercel\.app$/;

function configuredOrigins(): string[] {
  if (env.CORS_ORIGIN === '*') return ['*'];
  return env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
}

/** Fail fast in production when CORS is left wide open or unset. */
export function assertProductionCorsConfig(nodeEnv: string, corsOrigin: string): void {
  if (nodeEnv !== 'production') return;
  if (corsOrigin === '*' || !corsOrigin.trim()) {
    throw new Error(
      'CORS_ORIGIN must be set to explicit origin(s) in production (comma-separated). Wildcard * is not allowed.',
    );
  }
  const origins = corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0) {
    throw new Error('CORS_ORIGIN must include at least one explicit origin in production.');
  }
}

export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  const configured = configuredOrigins();
  if (configured.includes('*')) return true;
  if (configured.includes(origin)) return true;
  if (PHARMEX_FRONTEND_ORIGINS.includes(origin)) return true;
  return PHARMEX_FRONTEND_ORIGIN_PATTERN.test(origin);
}

export function getCorsOriginConfig():
  | string
  | string[]
  | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void) {
  const configured = configuredOrigins();
  if (configured.includes('*')) return '*';

  const staticOrigins = [...new Set([...configured, ...PHARMEX_FRONTEND_ORIGINS])];

  return (origin, callback) => {
    if (!origin || staticOrigins.includes(origin) || PHARMEX_FRONTEND_ORIGIN_PATTERN.test(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
}

export function getSocketCorsOrigins(): string | string[] {
  const configured = configuredOrigins();
  if (configured.includes('*')) return '*';
  return [...new Set([...configured, ...PHARMEX_FRONTEND_ORIGINS])];
}
