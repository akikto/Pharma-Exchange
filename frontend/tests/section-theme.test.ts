import { describe, expect, it } from 'vitest';
import {
  sectionThemeAccentBar,
  sectionThemeIconShell,
  sectionThemeShell,
} from '@/lib/section-theme';

describe('section-theme', () => {
  it('maps featured section to distinct shell classes', () => {
    expect(sectionThemeShell('featured')).toContain('section-shell-featured');
  });

  it('maps ai-pick section to distinct shell classes', () => {
    expect(sectionThemeShell('ai-pick')).toContain('section-shell-ai-pick');
  });

  it('returns empty shell for default theme', () => {
    expect(sectionThemeShell('default')).toBe('');
  });

  it('provides distinct accent bars per section', () => {
    expect(sectionThemeAccentBar('featured')).toContain('featured');
    expect(sectionThemeAccentBar('ai-pick')).toContain('ai-pick');
    expect(sectionThemeAccentBar('short-expiry')).toContain('short-expiry');
  });

  it('provides distinct icon shells per section', () => {
    expect(sectionThemeIconShell('featured')).toContain('text-featured');
    expect(sectionThemeIconShell('ai-pick')).toContain('text-ai-pick');
    expect(sectionThemeIconShell('catalog')).toContain('text-secondary');
  });
});
