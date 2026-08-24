import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import i18n from '@/i18n';
import en from '@/i18n/locales/en.json';

const BENGALI = /[\u0980-\u09FF]/;

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectStrings(v, out);
  }
}

describe('English-only UI', () => {
  it('initializes i18n to English only', () => {
    expect(i18n.language).toMatch(/^en/);
    expect(i18n.t('nav.home')).toBe('Home');
    expect(i18n.t('nav.homeSub')).toBe('');
  });

  it('has no Bengali script in en.json translation values', () => {
    const strings: string[] = [];
    collectStrings(en, strings);
    const bengali = strings.filter((s) => BENGALI.test(s));
    expect(bengali).toEqual([]);
  });

  it('has no hardcoded Bengali in frontend TSX source', () => {
    const srcRoot = resolve(import.meta.dirname, '../src');
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const name of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, name.name);
        if (name.isDirectory()) walk(full);
        else if (name.name.endsWith('.tsx')) {
          const text = readFileSync(full, 'utf8');
          if (BENGALI.test(text)) offenders.push(full.replace(srcRoot + '/', 'src/'));
        }
      }
    }

    walk(srcRoot);
    expect(offenders).toEqual([]);
  });
});
