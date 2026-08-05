import { describe, expect, it } from 'vitest';
import { isAllowedCorsOrigin, assertProductionCorsConfig } from '../src/config/cors';

describe('assertProductionCorsConfig', () => {
  it('throws when production CORS is wildcard', () => {
    expect(() => assertProductionCorsConfig('production', '*')).toThrow(/wildcard/i);
  });

  it('throws when production CORS is empty', () => {
    expect(() => assertProductionCorsConfig('production', '   ')).toThrow(/explicit origin/i);
  });

  it('allows explicit origins in production', () => {
    expect(() => assertProductionCorsConfig('production', 'https://example.com')).not.toThrow();
  });

  it('skips validation outside production', () => {
    expect(() => assertProductionCorsConfig('development', '*')).not.toThrow();
  });
});

describe('isAllowedCorsOrigin', () => {
  it('allows PharmEx production frontend', () => {
    expect(isAllowedCorsOrigin('https://pharma-exchange-frontend.vercel.app')).toBe(true);
  });

  it('allows legacy PharmEx frontend URL', () => {
    expect(isAllowedCorsOrigin('https://pharma-exchange.vercel.app')).toBe(true);
  });

  it('allows PharmEx Vercel preview deployments', () => {
    expect(isAllowedCorsOrigin('https://pharma-exchange-frontend-git-main-akikto.vercel.app')).toBe(true);
  });

  it('allows missing origin (same-site or server-to-server)', () => {
    expect(isAllowedCorsOrigin(undefined)).toBe(true);
  });
});
