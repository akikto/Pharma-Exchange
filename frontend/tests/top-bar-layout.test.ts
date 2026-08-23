import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('TopBar layout', () => {
  it('applies horizontal page gutter so titles do not sit on the screen edge', () => {
    const source = readFileSync(
      resolve(import.meta.dirname, '../src/components/layout/top-bar.tsx'),
      'utf8',
    );
    expect(source).toMatch(/px-4 h-14/);
    expect(source).not.toMatch(/px-0 h-14/);
  });
});
