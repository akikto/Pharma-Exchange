import { describe, expect, it } from 'vitest';
import { isAllowedCorsOrigin } from '../src/config/cors';

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
