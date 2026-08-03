import { describe, expect, it } from 'vitest';
import { getDocumentDirection } from '@/lib/rtl-utils';

describe('rtl-utils', () => {
  it('uses ltr for Bengali (Bengali script is left-to-right)', () => {
    expect(getDocumentDirection('bn')).toBe('ltr');
    expect(getDocumentDirection('bn-BD')).toBe('ltr');
  });

  it('uses ltr for English locales', () => {
    expect(getDocumentDirection('en')).toBe('ltr');
    expect(getDocumentDirection('en-US')).toBe('ltr');
  });
});
