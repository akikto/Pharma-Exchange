import { describe, expect, it } from 'vitest';
import { getDocumentDirection } from '@/lib/rtl-utils';

describe('rtl-utils', () => {
  it('uses rtl for Bengali locales', () => {
    expect(getDocumentDirection('bn')).toBe('rtl');
    expect(getDocumentDirection('bn-BD')).toBe('rtl');
  });

  it('uses ltr for English locales', () => {
    expect(getDocumentDirection('en')).toBe('ltr');
    expect(getDocumentDirection('en-US')).toBe('ltr');
  });
});
