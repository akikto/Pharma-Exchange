/** Canonical PharmEx frontend URLs (Vercel production + common misconfiguration). */
export const PHARMEX_FRONTEND_ORIGINS = [
  'https://pharma-exchange-frontend.vercel.app',
  'https://pharma-exchange.vercel.app',
];

/** Vercel preview deployments for the PharmEx frontend project. */
export const PHARMEX_FRONTEND_ORIGIN_PATTERN =
  /^https:\/\/pharma-exchange-frontend(?:-[a-z0-9-]+)?\.vercel\.app$/;
