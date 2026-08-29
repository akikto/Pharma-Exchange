import { cn } from '@/lib/utils';

/** Visual identity for home feed sections — styling only, no layout changes. */
export type SectionTheme = 'default' | 'featured' | 'ai-pick' | 'short-expiry' | 'catalog';

const sectionShellClasses: Record<SectionTheme, string> = {
  default: '',
  featured: 'section-shell section-shell-featured',
  'ai-pick': 'section-shell section-shell-ai-pick',
  'short-expiry': 'section-shell section-shell-short-expiry',
  catalog: 'section-shell section-shell-catalog',
};

const sectionAccentBar: Record<SectionTheme, string> = {
  default: 'from-primary to-accent',
  featured: 'from-featured to-accent',
  'ai-pick': 'from-ai-pick to-secondary',
  'short-expiry': 'from-short-expiry to-warning',
  catalog: 'from-secondary to-primary',
};

const sectionIconShell: Record<SectionTheme, string> = {
  default: 'bg-primary-subtle text-primary',
  featured: 'bg-featured-subtle text-featured',
  'ai-pick': 'bg-ai-pick-subtle text-ai-pick',
  'short-expiry': 'bg-short-expiry-subtle text-short-expiry',
  catalog: 'bg-secondary-subtle text-secondary',
};

export function sectionThemeShell(theme: SectionTheme = 'default', className?: string): string {
  return cn(sectionShellClasses[theme], className);
}

export function sectionThemeAccentBar(theme: SectionTheme = 'default'): string {
  return sectionAccentBar[theme];
}

export function sectionThemeIconShell(theme: SectionTheme = 'default'): string {
  return sectionIconShell[theme];
}
