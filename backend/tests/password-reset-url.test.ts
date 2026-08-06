import { describe, expect, it } from 'vitest';
import {
  assertProductionPasswordResetConfig,
  isBackendLikeOrigin,
  isKnownFrontendOrigin,
  resolvePasswordResetBaseUrl,
} from '../src/config/password-reset-url';

describe('isBackendLikeOrigin', () => {
  it('detects PharmEx production backend URL', () => {
    expect(isBackendLikeOrigin('https://pharma-exchange-backend.vercel.app')).toBe(true);
  });

  it('detects PharmEx preview backend URLs', () => {
    expect(isBackendLikeOrigin('https://pharma-exchange-backend-351nuqm7j-akikto1.vercel.app')).toBe(
      true,
    );
  });

  it('does not flag the frontend URL', () => {
    expect(isBackendLikeOrigin('https://pharma-exchange-frontend.vercel.app')).toBe(false);
  });
});

describe('isKnownFrontendOrigin', () => {
  it('recognizes production frontend URLs', () => {
    expect(isKnownFrontendOrigin('https://pharma-exchange-frontend.vercel.app')).toBe(true);
    expect(isKnownFrontendOrigin('https://pharma-exchange.vercel.app')).toBe(true);
  });

  it('recognizes Vercel preview frontend URLs', () => {
    expect(isKnownFrontendOrigin('https://pharma-exchange-frontend-git-main-akikto.vercel.app')).toBe(
      true,
    );
  });
});

describe('resolvePasswordResetBaseUrl', () => {
  it('uses PASSWORD_RESET_URL_BASE when set to the frontend', () => {
    expect(
      resolvePasswordResetBaseUrl({
        passwordResetUrlBase: 'https://pharma-exchange-frontend.vercel.app/',
        corsOrigin: 'https://pharma-exchange-backend.vercel.app',
        nodeEnv: 'production',
      }),
    ).toBe('https://pharma-exchange-frontend.vercel.app');
  });

  it('rejects backend URLs in PASSWORD_RESET_URL_BASE', () => {
    expect(() =>
      resolvePasswordResetBaseUrl({
        passwordResetUrlBase: 'https://pharma-exchange-backend.vercel.app',
        corsOrigin: 'https://pharma-exchange-frontend.vercel.app',
        nodeEnv: 'production',
      }),
    ).toThrow(/frontend app, not the API backend/i);
  });

  it('requires PASSWORD_RESET_URL_BASE in production', () => {
    expect(() =>
      resolvePasswordResetBaseUrl({
        corsOrigin: 'https://pharma-exchange-frontend.vercel.app',
        nodeEnv: 'production',
      }),
    ).toThrow(/required in production/i);
  });

  it('falls back to a non-backend CORS origin in development', () => {
    expect(
      resolvePasswordResetBaseUrl({
        corsOrigin:
          'https://pharma-exchange-backend.vercel.app,https://pharma-exchange-frontend.vercel.app',
        nodeEnv: 'development',
      }),
    ).toBe('https://pharma-exchange-frontend.vercel.app');
  });

  it('defaults to localhost in development when CORS is wildcard', () => {
    expect(
      resolvePasswordResetBaseUrl({
        corsOrigin: '*',
        nodeEnv: 'development',
      }),
    ).toBe('http://localhost:5173');
  });
});

describe('assertProductionPasswordResetConfig', () => {
  it('throws when PASSWORD_RESET_URL_BASE is missing in production', () => {
    expect(() =>
      assertProductionPasswordResetConfig('production', undefined, 'https://example.com'),
    ).toThrow(/PASSWORD_RESET_URL_BASE is required/i);
  });

  it('throws when PASSWORD_RESET_URL_BASE points at the backend', () => {
    expect(() =>
      assertProductionPasswordResetConfig(
        'production',
        'https://pharma-exchange-backend.vercel.app',
        'https://pharma-exchange-frontend.vercel.app',
      ),
    ).toThrow(/frontend app, not the API backend/i);
  });

  it('allows a frontend URL in production', () => {
    expect(() =>
      assertProductionPasswordResetConfig(
        'production',
        'https://pharma-exchange-frontend.vercel.app',
        'https://pharma-exchange-frontend.vercel.app',
      ),
    ).not.toThrow();
  });

  it('skips validation outside production', () => {
    expect(() =>
      assertProductionPasswordResetConfig('development', undefined, '*'),
    ).not.toThrow();
  });
});
