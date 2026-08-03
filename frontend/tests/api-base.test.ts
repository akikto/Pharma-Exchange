import { describe, expect, it } from 'vitest';
import { buildApiUrl, resolveApiBase } from '@/lib/api-base';

describe('resolveApiBase', () => {
  it('defaults to /api/v1 when unset', () => {
    expect(resolveApiBase(undefined, undefined)).toBe('/api/v1');
  });

  it('keeps an explicit /api/v1 base', () => {
    expect(resolveApiBase('/api/v1')).toBe('/api/v1');
    expect(resolveApiBase('https://api.example.com/api/v1')).toBe('https://api.example.com/api/v1');
  });

  it('appends /v1 when base ends with /api', () => {
    expect(resolveApiBase('/api')).toBe('/api/v1');
    expect(resolveApiBase('https://api.example.com/api')).toBe('https://api.example.com/api/v1');
  });

  it('appends /api/v1 when base is a bare server origin', () => {
    expect(resolveApiBase('http://localhost:3000')).toBe('http://localhost:3000/api/v1');
    expect(resolveApiBase('https://pharma-exchange-backend.vercel.app')).toBe(
      'https://pharma-exchange-backend.vercel.app/api/v1',
    );
  });

  it('supports the legacy VITE_API_URL env name', () => {
    expect(resolveApiBase(undefined, 'http://localhost:3000')).toBe('http://localhost:3000/api/v1');
  });

  it('strips trailing slashes before normalizing', () => {
    expect(resolveApiBase('http://localhost:3000/')).toBe('http://localhost:3000/api/v1');
    expect(resolveApiBase('/api/v1/')).toBe('/api/v1');
  });
});

describe('buildApiUrl', () => {
  it('joins base and path without duplicate slashes', () => {
    expect(buildApiUrl('/api/v1', '/auth/register')).toBe('/api/v1/auth/register');
    expect(buildApiUrl('/api/v1', 'auth/login')).toBe('/api/v1/auth/login');
  });
});
