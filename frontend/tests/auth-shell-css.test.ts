import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('auth shell CSS', () => {
  it('defines auth-shell-x with max(gutter, safe-area)', () => {
    const css = readFileSync(resolve(import.meta.dirname, '../src/index.css'), 'utf8');
    expect(css).toContain('.auth-shell-x');
    expect(css).toMatch(/auth-shell-x[\s\S]*max\(1\.5rem,\s*env\(safe-area-inset-left/);
  });
});
